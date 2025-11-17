import { OpenAIUsage, DashboardStats } from '@/types/openai-usage';
import { calculateCost } from './openai-pricing';
import { format, parseISO } from 'date-fns';

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
    const { inputCost, outputCost, totalCost: recordCost } = calculateCost(
      record.modelo_ai,
      record.usage?.input_tokens || 0,
      record.usage?.output_tokens || 0
    );
    
    totalCost += recordCost;
    totalInputTokens += record.usage?.input_tokens || 0;
    totalOutputTokens += record.usage?.output_tokens || 0;
    totalTokens += record.usage?.total_tokens || 0;
    
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
    
    // Por día
    try {
      const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
      dailyCostsMap[date] = (dailyCostsMap[date] || 0) + recordCost;
      requestsByDay[date] = (requestsByDay[date] || 0) + 1;
    } catch (error) {
      console.error('Error al parsear fecha:', record.timestamp);
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

