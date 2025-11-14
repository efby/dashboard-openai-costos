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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Obtener modelos únicos para el filtro
  const uniqueModels = Array.from(new Set(records.map(r => r.modelo_ai))).sort();

  // Filtrar registros por modelo
  let filteredRecords = records;
  if (filterModel !== 'all') {
    filteredRecords = records.filter(r => r.modelo_ai === filterModel);
  }

  // Filtrar por búsqueda de texto (nombre de candidato)
  if (searchTerm.trim() !== '') {
    filteredRecords = filteredRecords.filter(r => {
      const candidateName = (r.nombre_candidato || r.nombre).toLowerCase();
      const search = searchTerm.toLowerCase();
      return candidateName.includes(search);
    });
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Consultas
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {sortedRecords.length} {sortedRecords.length === 1 ? 'resultado' : 'resultados'}
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de búsqueda */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre de candidato..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <select
              value={filterModel}
              onChange={(e) => {
                setFilterModel(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los modelos</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'cost')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Ordenar por fecha</option>
              <option value="cost">Ordenar por costo</option>
            </select>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(searchTerm || filterModel !== 'all') && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                Búsqueda: &ldquo;{searchTerm}&rdquo;
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            )}
            {filterModel !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                Modelo: {filterModel}
                <button
                  onClick={() => {
                    setFilterModel('all');
                    setCurrentPage(1);
                  }}
                  className="hover:text-purple-600 dark:hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterModel('all');
                setCurrentPage(1);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span className="sr-only">Expandir</span>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
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
          <tbody className="bg-white dark:bg-gray-800">
            {paginatedRecords.map((record) => {
              const cost = calculateCost(
                record.modelo_ai,
                record.usage.input_tokens,
                record.usage.output_tokens
              );
              const isExpanded = expandedRow === record.id;
              
              // Convertir a string si es objeto
              const inputPromtStr = typeof record.input_promt === 'string' 
                ? record.input_promt 
                : record.input_promt 
                  ? JSON.stringify(record.input_promt, null, 2)
                  : '';
              
              const respuestaBusquedaStr = typeof record.respuesta_busqueda === 'string'
                ? record.respuesta_busqueda
                : record.respuesta_busqueda
                  ? JSON.stringify(record.respuesta_busqueda, null, 2)
                  : '';
              
              const hasDetails = inputPromtStr || respuestaBusquedaStr;
              
              // Verificar si hay campos null en respuesta_busqueda
              const checkForNulls = (obj: any): { hasNulls: boolean; nullFields: string[] } => {
                if (!obj) return { hasNulls: false, nullFields: [] };
                if (typeof obj === 'string') return { hasNulls: false, nullFields: [] };
                
                const nullFields: string[] = [];
                Object.entries(obj).forEach(([key, value]) => {
                  if (value === null || value === undefined || value === '') {
                    nullFields.push(key);
                  }
                });
                
                return { hasNulls: nullFields.length > 0, nullFields };
              };
              
              const responseStatus = checkForNulls(record.respuesta_busqueda);
              
              // Determinar el estado general del registro
              const getRecordStatus = () => {
                if (!record.respuesta_busqueda) {
                  return { type: 'no-response', label: 'Sin respuesta', color: 'gray' };
                }
                if (responseStatus.hasNulls) {
                  return { type: 'warning', label: 'Campos incompletos', color: 'yellow' };
                }
                return { type: 'success', label: 'Completo', color: 'green' };
              };
              
              const status = getRecordStatus();

              return (
                <>
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    {/* Botón expandir */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasDetails && (
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : record.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform"
                          title="Ver detalles de prompt y respuesta"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </td>
                    
                    {/* Estado de la respuesta */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => hasDetails && setExpandedRow(isExpanded ? null : record.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors
                          ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800' : ''}
                          ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 cursor-pointer' : ''}
                          ${status.color === 'gray' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : ''}
                        `}
                        disabled={!hasDetails}
                        title={status.type === 'warning' ? `Campos incompletos: ${responseStatus.nullFields.join(', ')}` : status.label}
                      >
                        {status.color === 'green' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {status.color === 'yellow' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {status.color === 'gray' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">{status.label}</span>
                      </button>
                    </td>
                    
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
                  
                  {/* Fila expandida con detalles */}
                  {isExpanded && hasDetails && (
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="space-y-4">
                          {/* Advertencia de campos null */}
                          {responseStatus.hasNulls && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                                    ⚠️ Respuesta con campos incompletos
                                  </p>
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Los siguientes campos están vacíos o son nulos:
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {responseStatus.nullFields.map((field) => (
                                      <span
                                        key={field}
                                        className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-xs font-mono"
                                      >
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Input Prompt */}
                          {inputPromtStr && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Prompt Enviado:
                                {typeof record.input_promt !== 'string' && (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(formato JSON)</span>
                                )}
                              </h4>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                  {inputPromtStr}
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Respuesta */}
                          {respuestaBusquedaStr && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Respuesta Obtenida:
                                {typeof record.respuesta_busqueda !== 'string' && (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">(formato JSON)</span>
                                )}
                              </h4>
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {respuestaBusquedaStr}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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

