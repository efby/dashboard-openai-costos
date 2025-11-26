import { OpenAIUsage, DashboardStats } from '@/types/openai-usage';
import { formatCost } from './openai-pricing';

/**
 * Convierte datos a formato CSV
 */
export function exportToCSV(records: OpenAIUsage[], stats: DashboardStats): string {
  const headers = [
    'Fecha',
    'Candidato',
    'Modelo AI',
    'Tipo Búsqueda',
    'Último Cargo',
    'Tokens Entrada',
    'Tokens Salida',
    'Tokens Total',
    'Costo Estimado'
  ];

  const rows = records.map(record => {
    const cost = calculateRecordCost(record);
    return [
      new Date(record.timestamp).toLocaleString('es-ES'),
      record.nombre_candidato || record.nombre || '',
      record.modelo_ai || '',
      record.tipo_busqueda || '',
      record.ultimoCargo || '',
      record.usage?.input_tokens || 0,
      record.usage?.output_tokens || 0,
      record.usage?.total_tokens || 0,
      formatCost(cost)
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

/**
 * Genera un reporte en formato texto
 */
export function exportToTextReport(records: OpenAIUsage[], stats: DashboardStats): string {
  const report = `
REPORTE DE COSTOS OPENAI
========================
Generado: ${new Date().toLocaleString('es-ES')}

RESUMEN GENERAL
---------------
Costo Total: ${formatCost(stats.totalCost)}
Total Consultas: ${stats.totalRequests?.toLocaleString() || 0}
Tokens Totales: ${stats.totalTokens?.toLocaleString() || 0}
  - Entrada: ${stats.totalInputTokens?.toLocaleString() || 0}
  - Salida: ${stats.totalOutputTokens?.toLocaleString() || 0}
Costo Promedio por Consulta: ${formatCost(stats.totalRequests ? stats.totalCost / stats.totalRequests : 0)}
Eficiencia (Salida/Entrada): ${stats.totalInputTokens ? (stats.totalOutputTokens / stats.totalInputTokens).toFixed(2) : '0.00'}x

COSTOS POR MODELO
-----------------
${Object.entries(stats.costByModel)
  .sort(([,a], [,b]) => b - a)
  .map(([model, cost]) => `${model}: ${formatCost(cost)}`)
  .join('\n')}

TOP 10 CANDIDATOS POR COSTO
---------------------------
${Object.entries(stats.costByCandidate)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([candidate, cost], index) => `${index + 1}. ${candidate}: ${formatCost(cost)}`)
  .join('\n')}

COSTOS POR TIPO DE BÚSQUEDA
---------------------------
${Object.entries(stats.costBySearchType)
  .sort(([,a], [,b]) => b - a)
  .map(([type, cost]) => `${type}: ${formatCost(cost)}`)
  .join('\n')}

REGISTROS DETALLADOS (${records.length} registros)
==================
${records.slice(0, 100).map((record, index) => `
${index + 1}. ${new Date(record.timestamp).toLocaleString('es-ES')}
   Candidato: ${record.nombre_candidato || record.nombre || 'N/A'}
   Modelo: ${record.modelo_ai || 'N/A'}
   Tipo: ${record.tipo_busqueda || 'N/A'}
   Tokens: ${record.usage?.total_tokens || 0} (${record.usage?.input_tokens || 0} entrada, ${record.usage?.output_tokens || 0} salida)
   Costo: ${formatCost(calculateRecordCost(record))}
`).join('')}
${records.length > 100 ? `\n... y ${records.length - 100} registros más` : ''}
`;

  return report.trim();
}

/**
 * Descarga un archivo
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calcula el costo de un registro individual
 */
function calculateRecordCost(record: OpenAIUsage): number {
  // Importar la función de cálculo de costos
  // Por simplicidad, usamos una estimación básica aquí
  const inputTokens = record.usage?.input_tokens || 0;
  const outputTokens = record.usage?.output_tokens || 0;
  
  // Precios aproximados (deberían venir de openai-pricing.ts)
  const inputCostPer1K = 0.0015; // $0.0015 per 1K tokens (ejemplo para GPT-3.5)
  const outputCostPer1K = 0.002;  // $0.002 per 1K tokens
  
  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;
  
  return inputCost + outputCost;
}

/**
 * Genera estadísticas resumidas para exportación
 */
export function generateExportSummary(records: OpenAIUsage[], stats: DashboardStats) {
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    dateRange: {
      start: records.length > 0 ? new Date(Math.min(...records.map(r => new Date(r.timestamp).getTime()))).toISOString() : null,
      end: records.length > 0 ? new Date(Math.max(...records.map(r => new Date(r.timestamp).getTime()))).toISOString() : null
    },
    stats: {
      totalCost: stats.totalCost,
      totalRequests: stats.totalRequests,
      totalTokens: stats.totalTokens,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      averageCostPerRequest: stats.totalRequests ? stats.totalCost / stats.totalRequests : 0,
      efficiency: stats.totalInputTokens ? stats.totalOutputTokens / stats.totalInputTokens : 0
    },
    topModels: Object.entries(stats.costByModel)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([model, cost]) => ({ model, cost })),
    topCandidates: Object.entries(stats.costByCandidate)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([candidate, cost]) => ({ candidate, cost })),
    searchTypes: Object.entries(stats.costBySearchType)
      .sort(([,a], [,b]) => b - a)
      .map(([type, cost]) => ({ type, cost }))
  };

  return summary;
}
