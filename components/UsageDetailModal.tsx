'use client';

import { OpenAIUsage } from '@/types/openai-usage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UsageDetailModalProps {
  record: OpenAIUsage | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageDetailModal({ record, isOpen, onClose }: UsageDetailModalProps) {
  if (!isOpen || !record) return null;

  // Funciones auxiliares
  const toDisplayString = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const getDataType = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return 'texto';
    if (Array.isArray(data)) return `array (${data.length} ${data.length === 1 ? 'elemento' : 'elementos'})`;
    return 'objeto';
  };

  const checkForNulls = (data: any): { hasNulls: boolean; nullFields: string[]; totalFields: number; percentage: number; isCritical: boolean } => {
    if (!data) return { hasNulls: false, nullFields: [], totalFields: 0, percentage: 0, isCritical: false };
    if (typeof data === 'string') return { hasNulls: false, nullFields: [], totalFields: 0, percentage: 0, isCritical: false };

    const nullFields: string[] = [];
    let totalFields = 0;

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const entries = Object.entries(item);
          totalFields += entries.length;
          entries.forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
              nullFields.push(`[${index}].${key}`);
            }
          });
        }
      });
    } else if (typeof data === 'object') {
      const entries = Object.entries(data);
      totalFields = entries.length;
      entries.forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
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

  const inputPromtStr = toDisplayString(record.input_promt);
  const inputPromtType = getDataType(record.input_promt);
  const respuestaBusquedaStr = toDisplayString(record.respuesta_busqueda);
  const respuestaBusquedaType = getDataType(record.respuesta_busqueda);
  const responseStatus = checkForNulls(record.respuesta_busqueda);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalles de la Consulta
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {record.nombre_candidato || record.nombre} • {format(parseISO(record.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Advertencia de campos null */}
            {responseStatus.hasNulls && (
              <div className={`rounded-lg p-4 border ${
                responseStatus.isCritical
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    responseStatus.isCritical
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      responseStatus.isCritical
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {responseStatus.isCritical ? '🚨 ESTADO CRÍTICO' : '⚠️ Campos Incompletos'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      responseStatus.isCritical
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {responseStatus.percentage}% de campos vacíos ({responseStatus.nullFields.length} de {responseStatus.totalFields} campos)
                      {responseStatus.isCritical && ' - Requiere atención inmediata'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {responseStatus.nullFields.map((field) => (
                        <span
                          key={field}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono ${
                            responseStatus.isCritical
                              ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                              : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                          }`}
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Prompt Enviado
                  {inputPromtType && inputPromtType !== 'texto' && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">
                      ({inputPromtType})
                    </span>
                  )}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                    {inputPromtStr}
                  </pre>
                </div>
              </div>
            )}

            {/* Respuesta */}
            {respuestaBusquedaStr && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Respuesta Obtenida
                  {respuestaBusquedaType && respuestaBusquedaType !== 'texto' && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">
                      ({respuestaBusquedaType})
                    </span>
                  )}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {respuestaBusquedaStr}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

