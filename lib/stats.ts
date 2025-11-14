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
  const dailyCostsMap: Record<string, number> = {};
  
  records.forEach(record => {
    const { inputCost, outputCost, totalCost: recordCost } = calculateCost(
      record.modelo_ai,
      record.usage.input_tokens,
      record.usage.output_tokens
    );
    
    totalCost += recordCost;
    totalInputTokens += record.usage.input_tokens;
    totalOutputTokens += record.usage.output_tokens;
    totalTokens += record.usage.total_tokens;
    
    // Por modelo
    costByModel[record.modelo_ai] = (costByModel[record.modelo_ai] || 0) + recordCost;
    requestsByModel[record.modelo_ai] = (requestsByModel[record.modelo_ai] || 0) + 1;
    
    // Por candidato
    const candidate = record.nombre_candidato || record.nombre;
    costByCandidate[candidate] = (costByCandidate[candidate] || 0) + recordCost;
    
    // Por tipo de búsqueda
    costBySearchType[record.tipo_busqueda] = (costBySearchType[record.tipo_busqueda] || 0) + recordCost;
    
    // Por día
    try {
      const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
      dailyCostsMap[date] = (dailyCostsMap[date] || 0) + recordCost;
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
  };
}

