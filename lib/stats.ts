import { OpenAIUsage, DashboardStats } from '@/types/openai-usage';
import { calculateCost } from './openai-pricing';
import { format, parseISO } from 'date-fns';

// Cache para memoización de cálculos costosos
const dateFormatCache = new Map<string, string>();
const costCache = new Map<string, number>();

/**
 * Normaliza los tokens de la estructura usage para soportar ambos formatos:
 * - Nuevo: input_tokens / output_tokens
 * - Antiguo: prompt_tokens / completion_tokens
 */
function normalizeTokens(usage: any): { input: number; output: number; total: number } {
  if (!usage) {
    return { input: 0, output: 0, total: 0 };
  }
  
  // Intentar con estructura nueva primero
  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? (inputTokens + outputTokens);
  
  return {
    input: inputTokens,
    output: outputTokens,
    total: totalTokens
  };
}

/**
 * Formatea una fecha con memoización
 */
function formatDateCached(timestamp: string): string {
  if (dateFormatCache.has(timestamp)) {
    return dateFormatCache.get(timestamp)!;
  }
  
  try {
    const formatted = format(parseISO(timestamp), 'yyyy-MM-dd');
    dateFormatCache.set(timestamp, formatted);
    return formatted;
  } catch (error) {
    console.error('Error al parsear fecha:', timestamp);
    return 'unknown';
  }
}

/**
 * Calcula el costo con memoización (basado en modelo + tokens)
 */
function calculateCostCached(
  modelo: string,
  inputTokens: number,
  outputTokens: number
): number {
  const cacheKey = `${modelo}-${inputTokens}-${outputTokens}`;
  
  if (costCache.has(cacheKey)) {
    return costCache.get(cacheKey)!;
  }
  
  const result = calculateCost(modelo, inputTokens, outputTokens);
  const totalCost = result.totalCost;
  
  // Cachear solo si el costo es razonable (evitar cachear valores anormales)
  if (totalCost < 1000 && totalCost >= 0) {
    costCache.set(cacheKey, totalCost);
  }
  
  return totalCost;
}

/**
 * Calcula las estadísticas del dashboard de forma incremental
 * Solo procesa los nuevos registros y actualiza las estadísticas existentes
 */
export function calculateIncrementalStats(
  previousStats: DashboardStats | null,
  newRecords: OpenAIUsage[]
): DashboardStats {
  // Si no hay stats previas, calcular desde cero
  if (!previousStats || newRecords.length === 0) {
    return calculateDashboardStats(newRecords);
  }
  
  // Si no hay nuevos registros, retornar stats previas
  if (newRecords.length === 0) {
    return previousStats;
  }
  
  // Calcular stats solo de los nuevos registros
  const newStats = calculateDashboardStats(newRecords);
  
  // Combinar con stats previas
  return {
    totalCost: Number((previousStats.totalCost + newStats.totalCost).toFixed(4)),
    totalRequests: previousStats.totalRequests + newStats.totalRequests,
    totalInputTokens: previousStats.totalInputTokens + newStats.totalInputTokens,
    totalOutputTokens: previousStats.totalOutputTokens + newStats.totalOutputTokens,
    totalTokens: previousStats.totalTokens + newStats.totalTokens,
    
    // Combinar objetos por modelo
    costByModel: combineObjects(previousStats.costByModel, newStats.costByModel),
    requestsByModel: combineObjects(previousStats.requestsByModel, newStats.requestsByModel),
    
    // Combinar objetos por candidato
    costByCandidate: combineObjects(previousStats.costByCandidate, newStats.costByCandidate),
    requestsByCandidate: combineObjects(previousStats.requestsByCandidate, newStats.requestsByCandidate),
    
    // Combinar objetos por tipo de búsqueda
    costBySearchType: combineObjects(previousStats.costBySearchType, newStats.costBySearchType),
    requestsBySearchType: combineObjects(previousStats.requestsBySearchType, newStats.requestsBySearchType),
    
    // Combinar arrays de costos diarios
    dailyCosts: combineDailyCosts(previousStats.dailyCosts, newStats.dailyCosts),
    requestsByDay: combineObjects(previousStats.requestsByDay, newStats.requestsByDay),
  };
}

/**
 * Combina dos objetos sumando los valores de las claves coincidentes
 */
function combineObjects(obj1: Record<string, number>, obj2: Record<string, number>): Record<string, number> {
  const combined = { ...obj1 };
  
  Object.entries(obj2).forEach(([key, value]) => {
    combined[key] = (combined[key] || 0) + value;
  });
  
  return combined;
}

/**
 * Combina dos arrays de costos diarios y los mantiene ordenados
 */
function combineDailyCosts(
  previous: Array<{ date: string; cost: number }>,
  newCosts: Array<{ date: string; cost: number }>
): Array<{ date: string; cost: number }> {
  const combinedMap: Record<string, number> = {};
  
  // Agregar costos previos
  previous.forEach(({ date, cost }) => {
    combinedMap[date] = (combinedMap[date] || 0) + cost;
  });
  
  // Agregar nuevos costos
  newCosts.forEach(({ date, cost }) => {
    combinedMap[date] = (combinedMap[date] || 0) + cost;
  });
  
  // Convertir a array y ordenar
  return Object.entries(combinedMap)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Limpia los caches de memoización (útil para liberar memoria)
 */
export function clearStatsCache(): void {
  dateFormatCache.clear();
  costCache.clear();
}

/**
 * Calcula las estadísticas del dashboard a partir de los registros de uso
 */
export function calculateDashboardStats(records: OpenAIUsage[]): DashboardStats {
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  
  const costByModel: Record<string, number> = {};
  const costByCandidate: Record<string, number> = {};
  const costBySearchType: Record<string, number> = {};
  const requestsByModel: Record<string, number> = {};
  const requestsByCandidate: Record<string, number> = {};
  const requestsBySearchType: Record<string, number> = {};
  const dailyCostsMap: Record<string, number> = {};
  const requestsByDay: Record<string, number> = {};
  
  records.forEach(record => {
    // Normalizar tokens para soportar ambas estructuras
    const tokens = normalizeTokens(record.usage);
    
    // Usar función memoizada para calcular costo
    const recordCost = calculateCostCached(
      record.modelo_ai,
      tokens.input,
      tokens.output
    );
    
    totalCost += recordCost;
    totalInputTokens += tokens.input;
    totalOutputTokens += tokens.output;
    totalTokens += tokens.total;
    
    // Por modelo
    const modelKey = record.modelo_ai || 'unknown';
    costByModel[modelKey] = (costByModel[modelKey] || 0) + recordCost;
    requestsByModel[modelKey] = (requestsByModel[modelKey] || 0) + 1;
    
    // Por candidato
    const candidate = record.nombre_candidato || record.nombre || 'unknown';
    costByCandidate[candidate] = (costByCandidate[candidate] || 0) + recordCost;
    requestsByCandidate[candidate] = (requestsByCandidate[candidate] || 0) + 1;
    
    // Por tipo de búsqueda
    const searchType = record.tipo_busqueda || 'unknown';
    costBySearchType[searchType] = (costBySearchType[searchType] || 0) + recordCost;
    requestsBySearchType[searchType] = (requestsBySearchType[searchType] || 0) + 1;
    
    // Por día (usar función memoizada)
    if (record.timestamp) {
      const date = formatDateCached(record.timestamp);
      dailyCostsMap[date] = (dailyCostsMap[date] || 0) + recordCost;
      requestsByDay[date] = (requestsByDay[date] || 0) + 1;
    }
  });
  
  // Convertir el mapa de costos diarios a array y ordenar
  const dailyCosts = Object.entries(dailyCostsMap)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalCost: Number(totalCost.toFixed(4)),
    totalRequests: records.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    costByModel,
    costByCandidate,
    costBySearchType,
    dailyCosts,
    requestsByModel,
    requestsByCandidate,
    requestsBySearchType,
    requestsByDay,
  };
}

