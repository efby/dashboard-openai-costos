'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DailyCostChartProps {
  data: Array<{ date: string; cost: number }>;
}

export default function DailyCostChart({ data }: DailyCostChartProps) {
  const chartData = data.map(item => ({
    fecha: format(parseISO(item.date), 'dd MMM', { locale: es }),
    fechaCompleta: format(parseISO(item.date), 'dd/MM/yyyy'),
    costo: Number(item.cost.toFixed(4)),
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Costos Diarios
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="fecha"
            fontSize={12}
          />
          <YAxis 
            label={{ value: 'Costo ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toFixed(4)}`}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.fechaCompleta;
              }
              return label;
            }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="costo" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Costo"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

