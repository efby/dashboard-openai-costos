'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CostByCandidateChartProps {
  data: Record<string, number>;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export default function CostByCandidateChart({ data }: CostByCandidateChartProps) {
  const chartData = Object.entries(data).map(([name, cost]) => ({
    nombre: name,
    costo: Number(cost.toFixed(4)),
  })).sort((a, b) => b.costo - a.costo).slice(0, 10); // Top 10

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Costos por Candidato (Top 10)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ nombre, percent }) => 
              `${nombre.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="costo"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `$${value.toFixed(4)}`}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend 
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

