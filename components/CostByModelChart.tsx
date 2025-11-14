'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CostByModelChartProps {
  data: Record<string, number>;
}

export default function CostByModelChart({ data }: CostByModelChartProps) {
  const chartData = Object.entries(data).map(([model, cost]) => ({
    modelo: model,
    costo: Number(cost.toFixed(4)),
  })).sort((a, b) => b.costo - a.costo);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Costos por Modelo
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="modelo" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis 
            label={{ value: 'Costo ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toFixed(4)}`}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          <Bar dataKey="costo" fill="#3b82f6" name="Costo" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

