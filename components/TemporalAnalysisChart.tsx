'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemporalAnalysisChartProps {
  dailyCosts: Array<{ date: string; cost: number }>;
  requestsByDay: Record<string, number>;
}

export default function TemporalAnalysisChart({ dailyCosts, requestsByDay }: TemporalAnalysisChartProps) {
  // Datos por día de la semana (solo últimos 7 días)
  const last7Days = dailyCosts.slice(-7);
  const dayOfWeekData = last7Days.reduce((acc, item) => {
    const dayName = format(parseISO(item.date), 'EEEE', { locale: es });
    if (!acc[dayName]) {
      acc[dayName] = { cost: 0, requests: 0 };
    }
    acc[dayName].cost += item.cost;
    acc[dayName].requests += requestsByDay[item.date] || 0;
    return acc;
  }, {} as Record<string, { cost: number; requests: number }>);

  const weekdayChartData = Object.entries(dayOfWeekData).map(([day, data]) => ({
    dia: day.charAt(0).toUpperCase() + day.slice(1, 3),
    diaCompleto: day,
    costo: Number(data.cost.toFixed(4)),
    consultas: data.requests,
  }));

  // Ordenar por día de la semana
  const dayOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  weekdayChartData.sort((a, b) => 
    dayOrder.indexOf((a.diaCompleto || '').toLowerCase()) - dayOrder.indexOf((b.diaCompleto || '').toLowerCase())
  );

  // Datos de la última semana
  const lastWeekData = dailyCosts
    .slice(-7)
    .map(item => ({
      fecha: format(parseISO(item.date), 'dd MMM', { locale: es }),
      costo: Number(item.cost.toFixed(4)),
      consultas: requestsByDay[item.date] || 0,
    }));

  // Estadísticas (últimos 7 días)
  const totalRequests7Days = last7Days.reduce((sum, item) => sum + (requestsByDay[item.date] || 0), 0);
  const avgRequestsPerDay = totalRequests7Days / Math.min(last7Days.length, 7);
  const peakDay = last7Days.reduce((max, item) => 
    item.cost > max.cost ? item : max
  , last7Days[0] || { date: '', cost: 0 });

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Últimos 7 Días</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{last7Days.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {last7Days.length > 0 ? `${format(parseISO(last7Days[0].date), 'dd MMM', { locale: es })} - ${format(parseISO(last7Days[last7Days.length - 1].date), 'dd MMM', { locale: es })}` : '-'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Promedio Diario</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgRequestsPerDay.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">consultas/día</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Día Pico (7 días)</p>
          <p className="text-2xl font-bold text-blue-600">
            ${peakDay.cost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {peakDay.date ? format(parseISO(peakDay.date), 'dd MMM', { locale: es }) : '-'}
          </p>
        </div>
      </div>

      {/* Gráfico por día de la semana */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análisis por Día de la Semana (Últimos 7 Días)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekdayChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return payload[0].payload.diaCompleto.charAt(0).toUpperCase() + payload[0].payload.diaCompleto.slice(1);
                }
                return label;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="costo" fill="#3b82f6" name="Costo ($)" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="consultas" fill="#10b981" name="Consultas" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de última semana */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tendencia Últimos 7 Días
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lastWeekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="costo" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              name="Costo ($)"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="consultas" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="Consultas"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

