'use client';

import { useState } from 'react';
import { OpenAIUsage } from '@/types/openai-usage';
import { calculateCost, formatCost } from '@/lib/openai-pricing';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UsageTableProps {
  records: OpenAIUsage[];
}

export default function UsageTable({ records }: UsageTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Obtener modelos únicos para el filtro
  const uniqueModels = Array.from(new Set(records.map(r => r.modelo_ai))).sort();

  // Filtrar registros
  let filteredRecords = records;
  if (filterModel !== 'all') {
    filteredRecords = records.filter(r => r.modelo_ai === filterModel);
  }

  // Ordenar registros
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      const costA = calculateCost(a.modelo_ai, a.usage.input_tokens, a.usage.output_tokens).totalCost;
      const costB = calculateCost(b.modelo_ai, b.usage.input_tokens, b.usage.output_tokens).totalCost;
      return costB - costA;
    }
  });

  // Paginación
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Historial de Consultas
        </h3>
        <div className="flex gap-4">
          <select
            value={filterModel}
            onChange={(e) => {
              setFilterModel(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los modelos</option>
            {uniqueModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'cost')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Ordenar por fecha</option>
            <option value="cost">Ordenar por costo</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Candidato
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Modelo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo Búsqueda
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tokens In
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tokens Out
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Costo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedRecords.map((record) => {
              const cost = calculateCost(
                record.modelo_ai,
                record.usage.input_tokens,
                record.usage.output_tokens
              );

              return (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {format(parseISO(record.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {record.nombre_candidato || record.nombre}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                      {record.modelo_ai}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {record.tipo_busqueda}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-300">
                    {record.usage.input_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-300">
                    {record.usage.output_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-300">
                    {formatCost(cost.totalCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
          <span className="font-medium">
            {Math.min(startIndex + itemsPerPage, sortedRecords.length)}
          </span>{' '}
          de <span className="font-medium">{sortedRecords.length}</span> resultados
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-3 py-2 text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

