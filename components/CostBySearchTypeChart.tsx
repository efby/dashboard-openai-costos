'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface CostBySearchTypeChartProps {
  data: Record<string, number>;
  requestsByType: Record<string, number>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CostBySearchTypeChart({ data, requestsByType }: CostBySearchTypeChartProps) {
  const chartData = Object.entries(data).map(([type, cost]) => ({
    tipo: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    costo: Number(cost.toFixed(4)),
    consultas: requestsByType[type] || 0,
    costoPromedio: requestsByType[type] ? Number((cost / requestsByType[type]).toFixed(4)) : 0,
  })).sort((a, b) => b.costo - a.costo);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.tipo}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Costo Total: <span className="font-semibold text-blue-600">${data.costo.toFixed(4)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Consultas: <span className="font-semibold">{data.consultas}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Costo Promedio: <span className="font-semibold text-green-600">${data.costoPromedio.toFixed(4)}</span>
          </p>
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

      {/* Tabla de detalles */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Consultas</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo Total</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {chartData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-gray-900 dark:text-gray-300">{item.tipo}</td>
                <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-300">{item.consultas}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-300">${item.costo.toFixed(4)}</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">${item.costoPromedio.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

