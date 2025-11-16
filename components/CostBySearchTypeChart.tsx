'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { OpenAIUsage } from '@/types/openai-usage';
import { calculateCost } from '@/lib/openai-pricing';

interface CostBySearchTypeChartProps {
  data: Record<string, number>;
  requestsByType: Record<string, number>;
  records: OpenAIUsage[];
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': '#3b82f6',
  'gpt-4o-mini': '#10b981',
  'gpt-4.1': '#f59e0b',
  'gpt-4-turbo': '#ef4444',
  'gpt-4': '#8b5cf6',
  'gpt-3.5-turbo': '#ec4899',
  'o1': '#14b8a6',
  'o1-mini': '#f97316',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

export default function CostBySearchTypeChart({ data, requestsByType, records }: CostBySearchTypeChartProps) {
  // Calcular costos por tipo de búsqueda y modelo
  const costByTypeAndModel: Record<string, Record<string, number>> = {};
  const requestsByTypeAndModel: Record<string, Record<string, number>> = {};
  
  records.forEach(record => {
    const searchType = record.tipo_busqueda;
    const model = record.modelo_ai;
    const cost = calculateCost(model, record.usage.input_tokens, record.usage.output_tokens).totalCost;
    
    if (!costByTypeAndModel[searchType]) {
      costByTypeAndModel[searchType] = {};
      requestsByTypeAndModel[searchType] = {};
    }
    
    costByTypeAndModel[searchType][model] = (costByTypeAndModel[searchType][model] || 0) + cost;
    requestsByTypeAndModel[searchType][model] = (requestsByTypeAndModel[searchType][model] || 0) + 1;
  });
  
  // Obtener todos los modelos únicos
  const allModels = Array.from(new Set(records.map(r => r.modelo_ai))).sort();
  
  // Simplificar nombres de modelos para la leyenda
  const simplifyModelName = (model: string): string => {
    return model.replace('gpt-', '').replace(/-2024.*/, '').replace(/-2025.*/, '').substring(0, 12);
  };
  
  // Preparar datos para el gráfico (volver al diseño simple)
  const chartData = Object.entries(data).map(([type, cost]) => ({
    tipo: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    costo: Number(cost.toFixed(4)),
    consultas: requestsByType[type] || 0,
    costoPromedio: requestsByType[type] ? Number((cost / requestsByType[type]).toFixed(4)) : 0,
  })).sort((a, b) => b.costo - a.costo);

  // Obtener color para un modelo
  const getModelColor = (model: string): string => {
    const baseModel = model.split('-')[0];
    return MODEL_COLORS[baseModel] || MODEL_COLORS[model] || '#64748b';
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.tipo}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Costo Total: <span className="font-semibold text-blue-600">${(data.costo || 0).toFixed(4)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Consultas: <span className="font-semibold">{data.consultas}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Costo Promedio: <span className="font-semibold text-green-600">${(data.costoPromedio || 0).toFixed(4)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Si no hay datos, mostrar mensaje
  if (chartData.length === 0 || records.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análisis por Tipo de Búsqueda
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Análisis por Tipo de Búsqueda
      </h3>
      
      {/* Resumen */}
      {chartData.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total de tipos: <span className="font-semibold text-gray-900 dark:text-white">{chartData.length}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Más costoso: <span className="font-semibold text-blue-600">{chartData[0]?.tipo || 'N/A'}</span> (${chartData[0]?.costo?.toFixed(4) || '0.0000'})
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="tipo" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis 
            label={{ value: 'Costo ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="costo" name="Costo Total" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tabla resumen de tipos de búsqueda */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Consultas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Costo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Promedio
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {chartData.map((item, index) => (
              <tr key={item.tipo} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.tipo}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.consultas}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                  ${item.costo.toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                  ${item.costoPromedio.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabla de detalles por modelo */}
      <div className="mt-6 overflow-x-auto">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Desglose por Modelo</h4>
        {Object.entries(costByTypeAndModel).sort((a, b) => {
          const totalA = Object.values(a[1]).reduce((sum, cost) => sum + cost, 0);
          const totalB = Object.values(b[1]).reduce((sum, cost) => sum + cost, 0);
          return totalB - totalA;
        }).map(([searchType, models]) => {
          const totalCost = Object.values(models).reduce((sum, cost) => sum + cost, 0);
          const totalRequests = Object.values(requestsByTypeAndModel[searchType] || {}).reduce((sum, count) => sum + count, 0);
          
          return (
            <div key={searchType} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between items-center">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {searchType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total: <span className="font-semibold text-blue-600">${totalCost.toFixed(4)}</span> ({totalRequests} consultas)
                </div>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Modelo</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Consultas</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Costo</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">% del Tipo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(models).sort((a, b) => b[1] - a[1]).map(([model, cost]) => {
                    const requests = requestsByTypeAndModel[searchType]?.[model] || 0;
                    const percentage = (cost / totalCost) * 100;
                    
                    return (
                      <tr key={model} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 text-gray-900 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm" 
                              style={{ backgroundColor: getModelColor(model) }}
                            />
                            {model}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-300">{requests}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-300">${cost.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

