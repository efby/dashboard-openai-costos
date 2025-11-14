'use client';

import { useState } from 'react';

interface TopCandidatesChartProps {
  data: Record<string, number>;
  requestsByCandidate: Record<string, number>;
}

export default function TopCandidatesChart({ data, requestsByCandidate }: TopCandidatesChartProps) {
  const [showAll, setShowAll] = useState(false);
  
  const chartData = Object.entries(data).map(([name, cost]) => ({
    nombre: name,
    costo: Number(cost.toFixed(4)),
    consultas: requestsByCandidate[name] || 0,
    costoPromedio: requestsByCandidate[name] ? Number((cost / requestsByCandidate[name]).toFixed(4)) : 0,
  })).sort((a, b) => b.costo - a.costo);

  const displayData = showAll ? chartData : chartData.slice(0, 10);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  const maxCost = chartData[0]?.costo || 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ranking de Candidatos
        </h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAll ? 'Ver Top 10' : `Ver todos (${chartData.length})`}
        </button>
      </div>

      {/* Resumen del podio */}
      {chartData.length >= 3 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {chartData.slice(0, 3).map((item, index) => (
            <div key={index} className={`p-4 rounded-lg text-center ${
              index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400' :
              index === 1 ? 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-400' :
              'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400'
            }`}>
              <div className="text-3xl mb-2">{getMedal(index)}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={item.nombre}>
                {item.nombre}
              </p>
              <p className="text-lg font-bold text-blue-600 mt-1">${item.costo.toFixed(2)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.consultas} consultas</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista completa */}
      <div className="space-y-3">
        {displayData.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {/* Posición */}
            <div className="flex-shrink-0 w-12 text-center font-bold text-gray-600 dark:text-gray-400">
              {getMedal(index)}
            </div>

            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate" title={item.nombre}>
                {item.nombre}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.consultas} consultas • ${item.costoPromedio.toFixed(4)} promedio
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="flex-1 hidden md:block">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(item.costo / maxCost) * 100}%` }}
                />
              </div>
            </div>

            {/* Costo */}
            <div className="flex-shrink-0 text-right min-w-[80px]">
              <p className="font-bold text-gray-900 dark:text-white">
                ${item.costo.toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((item.costo / chartData.reduce((sum, i) => sum + i.costo, 0)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas adicionales */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {chartData.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Candidatos totales</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${(chartData.reduce((sum, item) => sum + item.costo, 0) / chartData.length).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Costo promedio por candidato</p>
        </div>
      </div>
    </div>
  );
}

