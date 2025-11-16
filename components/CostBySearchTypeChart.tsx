'use client';

import React from 'react';
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
  
  // Preparar datos para el gráfico (por tipo de búsqueda)
  const chartData = Object.entries(data).map(([type, cost]) => ({
    tipo: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    costo: Number(cost.toFixed(4)),
    consultas: requestsByType[type] || 0,
    costoPromedio: requestsByType[type] ? Number((cost / requestsByType[type]).toFixed(4)) : 0,
  })).sort((a, b) => b.costo - a.costo);

  // Preparar datos para la tabla (una fila por tipo + modelo)
  const tableData: Array<{
    tipo: string;
    modelo: string;
    consultas: number;
    costo: number;
    costoPromedio: number;
  }> = [];

  Object.entries(costByTypeAndModel).forEach(([searchType, models]) => {
    Object.entries(models).forEach(([model, cost]) => {
      const requests = requestsByTypeAndModel[searchType]?.[model] || 0;
      tableData.push({
        tipo: searchType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        modelo: model,
        consultas: requests,
        costo: Number(cost.toFixed(4)),
        costoPromedio: requests > 0 ? Number((cost / requests).toFixed(4)) : 0,
      });
    });
  });

  // Ordenar por costo total descendente
  tableData.sort((a, b) => b.costo - a.costo);

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
  if (chartData.length === 0 || tableData.length === 0 || records.length === 0) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Análisis por Tipo de Búsqueda
      </h3>
      
      {/* Gráfico de barras */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="tipo" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={11}
          />
          <YAxis 
            label={{ value: 'Costo ($)', angle: -90, position: 'insideLeft' }}
            fontSize={11}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="costo" name="Costo Total" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Tabla detallada por modelo */}
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-3">
        Desglose por Tipo y Modelo
      </h4>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Tipo
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Modelo
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Consultas
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Costo Total
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Promedio
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((item, index) => (
              <tr key={`${item.tipo}-${item.modelo}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                  {item.tipo}
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: getModelColor(item.modelo) }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{item.modelo}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-xs text-gray-600 dark:text-gray-400">
                  {item.consultas}
                </td>
                <td className="px-3 py-2 text-right text-xs font-medium text-blue-600 dark:text-blue-400">
                  ${item.costo.toFixed(4)}
                </td>
                <td className="px-3 py-2 text-right text-xs font-medium text-green-600 dark:text-green-400">
                  ${item.costoPromedio.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
              <td colSpan={2} className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                TOTAL
              </td>
              <td className="px-3 py-2 text-right text-xs text-gray-900 dark:text-white">
                {tableData.reduce((sum, item) => sum + item.consultas, 0)}
              </td>
              <td className="px-3 py-2 text-right text-xs text-blue-600 dark:text-blue-400">
                ${tableData.reduce((sum, item) => sum + item.costo, 0).toFixed(4)}
              </td>
              <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

