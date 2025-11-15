'use client';

import { useState } from 'react';
import { OpenAIUsage } from '@/types/openai-usage';
import { calculateCost, formatCost } from '@/lib/openai-pricing';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import UsageDetailModal from './UsageDetailModal';

interface UsageTableProps {
  records: OpenAIUsage[];
}

export default function UsageTable({ records }: UsageTableProps) {
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'status'>('date');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterCritical, setFilterCritical] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<OpenAIUsage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Función para abrir el modal
  const openModal = (record: OpenAIUsage) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRecord(null), 200);
  };

  // Función auxiliar para calcular el estado de un registro (para ordenamiento)
  const getRecordStatusPriority = (record: OpenAIUsage): number => {
    if (!record.respuesta_busqueda) return 3; // Sin respuesta = prioridad baja
    
    // Calcular nulls (misma lógica que en el render)
    const ignoredFields = ['validador'];
    let nullCount = 0;
    let totalFields = 0;
    
    const data = record.respuesta_busqueda;
    if (typeof data === 'string') return 4; // String completo = prioridad más baja
    
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item).filter(([key]) => !ignoredFields.includes(key));
          totalFields += entries.length;
          entries.forEach(([, value]) => {
            if (value === null || value === undefined || value === '') {
              nullCount++;
            }
          });
        }
      });
    } else if (typeof data === 'object') {
      const entries = Object.entries(data).filter(([key]) => !ignoredFields.includes(key));
      totalFields = entries.length;
      entries.forEach(([, value]) => {
        if (value === null || value === undefined || value === '') {
          nullCount++;
        }
      });
    }
    
    if (totalFields === 0) return 4; // Sin campos = OK
    
    const percentage = (nullCount / totalFields) * 100;
    
    if (percentage > 50) return 0; // Crítico = prioridad máxima
    if (percentage > 0) return 1;  // Warning = prioridad media
    return 4; // Completo = prioridad más baja
  };

  // Obtener modelos únicos para el filtro
  const uniqueModels = Array.from(new Set(records.map(r => r.modelo_ai))).sort();

  // Filtrar registros por modelo
  let filteredRecords = records;
  if (filterModel !== 'all') {
    filteredRecords = records.filter(r => r.modelo_ai === filterModel);
  }

  // Filtrar por búsqueda de texto (nombre de candidato y tipo político)
  if (searchTerm.trim() !== '') {
    filteredRecords = filteredRecords.filter(r => {
      const candidateName = (r.nombre_candidato || r.nombre).toLowerCase();
      const candidateType = (r.tipoPolitico || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return candidateName.includes(search) || candidateType.includes(search);
    });
  }

  // Filtrar por criticidad (solo registros críticos)
  if (filterCritical) {
    filteredRecords = filteredRecords.filter(r => {
      const data = r.respuesta_busqueda;
      if (!data) return false;
      if (typeof data === 'string') return false;
      
      // Array vacío = crítico
      if (Array.isArray(data) && data.length === 0) return true;
      
      const ignoredFields = ['validador'];
      let nullCount = 0;
      let totalFields = 0;
      
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item && typeof item === 'object') {
            const entries = Object.entries(item).filter(([key]) => !ignoredFields.includes(key));
            totalFields += entries.length;
            entries.forEach(([, value]) => {
              if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                nullCount++;
              }
            });
          }
        });
      } else if (typeof data === 'object') {
        const entries = Object.entries(data).filter(([key]) => !ignoredFields.includes(key));
        totalFields = entries.length;
        entries.forEach(([, value]) => {
          if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
            nullCount++;
          }
        });
      }
      
      if (totalFields === 0) return false;
      const percentage = (nullCount / totalFields) * 100;
      return percentage > 50; // Crítico = >50%
    });
  }

  // Ordenar registros
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === 'cost') {
      const costA = calculateCost(a.modelo_ai, a.usage.input_tokens, a.usage.output_tokens).totalCost;
      const costB = calculateCost(b.modelo_ai, b.usage.input_tokens, b.usage.output_tokens).totalCost;
      return costB - costA;
    } else {
      // Ordenar por estado (crítico primero, luego warning, sin respuesta, completo)
      const priorityA = getRecordStatusPriority(a);
      const priorityB = getRecordStatusPriority(b);
      return priorityA - priorityB;
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
              placeholder="Buscar por candidato o tipo político..."
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
              onChange={(e) => setSortBy(e.target.value as 'date' | 'cost' | 'status')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Ordenar por fecha</option>
              <option value="cost">Ordenar por costo</option>
              <option value="status">Ordenar por estado (críticos primero)</option>
            </select>
            
            {/* Filtro de críticos */}
            <button
              onClick={() => {
                setFilterCritical(!filterCritical);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                filterCritical
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title={filterCritical ? 'Mostrando solo críticos (click para ver todos)' : 'Click para mostrar solo críticos'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {filterCritical ? 'Solo Críticos' : 'Filtrar Críticos'}
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(searchTerm || filterModel !== 'all' || filterCritical) && (
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
            {filterCritical && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
                🚨 Solo críticos (&gt;50% null)
                <button
                  onClick={() => {
                    setFilterCritical(false);
                    setCurrentPage(1);
                  }}
                  className="hover:text-red-600 dark:hover:text-red-100"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterModel('all');
                setFilterCritical(false);
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
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último Cargo
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
              
              const hasDetails = record.input_promt || record.respuesta_busqueda;
              
              // Verificar si hay campos null en respuesta_busqueda (puede ser objeto o array)
              // NOTA: Ignora el campo "validador" en el cálculo
              // NOTA: Array vacío [] se trata como dato vacío (100% crítico)
              const checkForNulls = (data: any): { hasNulls: boolean; nullFields: string[]; totalFields: number; percentage: number; isCritical: boolean } => {
                if (!data) return { hasNulls: false, nullFields: [], totalFields: 0, percentage: 0, isCritical: false };
                if (typeof data === 'string') return { hasNulls: false, nullFields: [], totalFields: 0, percentage: 0, isCritical: false };
                
                // Array vacío [] = dato vacío (crítico)
                if (Array.isArray(data) && data.length === 0) {
                  return { hasNulls: true, nullFields: ['array vacío'], totalFields: 1, percentage: 100, isCritical: true };
                }
                
                const nullFields: string[] = [];
                let totalFields = 0;
                const ignoredFields = ['validador']; // Campos que se ignoran en el cálculo
                
                if (Array.isArray(data)) {
                  data.forEach((item, index) => {
                    if (item && typeof item === 'object') {
                      const entries = Object.entries(item).filter(([key]) => !ignoredFields.includes(key));
                      totalFields += entries.length;
                      entries.forEach(([key, value]) => {
                        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                          nullFields.push(`[${index}].${key}`);
                        }
                      });
                    }
                  });
                } else if (typeof data === 'object') {
                  const entries = Object.entries(data).filter(([key]) => !ignoredFields.includes(key));
                  totalFields = entries.length;
                  entries.forEach(([key, value]) => {
                    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                      nullFields.push(key);
                    }
                  });
                }
                
                const percentage = totalFields > 0 ? (nullFields.length / totalFields) * 100 : 0;
                const isCritical = percentage > 50;
                
                return { 
                  hasNulls: nullFields.length > 0, 
                  nullFields, 
                  totalFields,
                  percentage: Math.round(percentage),
                  isCritical 
                };
              };
              
              const responseStatus = checkForNulls(record.respuesta_busqueda);
              
              // Determinar el estado general del registro
              const getRecordStatus = () => {
                if (!record.respuesta_busqueda) {
                  return { type: 'no-response', label: 'Sin respuesta', color: 'gray', icon: '✕' };
                }
                if (responseStatus.isCritical) {
                  return { type: 'critical', label: 'Crítico', color: 'red', icon: '⚠' };
                }
                if (responseStatus.hasNulls) {
                  return { type: 'warning', label: 'Incompleto', color: 'yellow', icon: '⚠' };
                }
                return { type: 'success', label: 'Completo', color: 'green', icon: '✓' };
              };
              
              const status = getRecordStatus();

              return (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                    {/* Botón ver detalles */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasDetails && (
                        <button
                          onClick={() => openModal(record)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Ver detalles de prompt y respuesta"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                    </td>
                    
                    {/* Estado de la respuesta */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => hasDetails && openModal(record)}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                          ${status.color === 'green' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer' : ''}
                          ${status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800 cursor-pointer' : ''}
                          ${status.color === 'red' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer' : ''}
                          ${status.color === 'gray' ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                        `}
                        disabled={!hasDetails}
                        title={
                          status.type === 'critical' 
                            ? `🚨 CRÍTICO: ${responseStatus.percentage}% de campos vacíos (${responseStatus.nullFields.length}/${responseStatus.totalFields}). Click para ver detalles.`
                            : status.type === 'warning'
                            ? `⚠️ ${responseStatus.percentage}% de campos vacíos (${responseStatus.nullFields.length}/${responseStatus.totalFields}). Click para ver detalles.`
                            : status.type === 'success'
                            ? '✓ Todos los campos completos. Click para ver detalles.'
                            : 'Sin respuesta'
                        }
                      >
                        <span>{status.icon}</span>
                        {(status.type === 'critical' || status.type === 'warning') && (
                          <span className="font-semibold">{responseStatus.percentage}%</span>
                        )}
                      </button>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {format(parseISO(record.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {record.nombre_candidato || record.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
                        {record.tipoPolitico || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                      {record.ultimoCargo ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                          {record.ultimoCargo}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs italic">Sin cargo</span>
                      )}
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

      {/* Modal para mostrar detalles */}
      <UsageDetailModal 
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

