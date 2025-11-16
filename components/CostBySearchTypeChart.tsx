'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  
  // Preparar datos para el gráfico
  const chartData = Object.entries(data).map(([type, totalCost]) => {
    const row: any = {
      tipo: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      costoTotal: Number(totalCost.toFixed(4)),
    };
    
    // Agregar costo por cada modelo
    allModels.forEach(model => {
      const modelKey = simplifyModelName(model);
      row[modelKey] = costByTypeAndModel[type]?.[model] ? Number(costByTypeAndModel[type][model].toFixed(4)) : 0;
    });
    
    return row;
  }).sort((a, b) => b.costoTotal - a.costoTotal);

  // Obtener color para un modelo
  const getModelColor = (model: string): string => {
    const baseModel = model.split('-')[0];
    return MODEL_COLORS[baseModel] || MODEL_COLORS[model] || '#64748b';
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalCost = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Costo Total: <span className="font-semibold text-blue-600">${totalCost.toFixed(4)}</span>
          </p>
          <div className="space-y-1">
            {payload.filter((entry: any) => entry.value > 0).map((entry: any, index: number) => (
              <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span> ${entry.value.toFixed(4)}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Análisis por Tipo de Búsqueda
      </h3>
      
      {/* Resumen */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de tipos: <span className="font-semibold text-gray-900 dark:text-white">{chartData.length}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Más costoso: <span className="font-semibold text-blue-600">{chartData[0]?.tipo}</span> (${chartData[0]?.costo.toFixed(4)})
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
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
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="square"
          />
          {allModels.map((model) => {
            const modelKey = simplifyModelName(model);
            const color = getModelColor(model);
            return (
              <Bar 
                key={model} 
                dataKey={modelKey} 
                name={modelKey}
                stackId="a" 
                fill={color}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>

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

