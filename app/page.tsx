'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import StatCard from '@/components/StatCard';
import CostByModelChart from '@/components/CostByModelChart';
import DailyCostChart from '@/components/DailyCostChart';
import CostByCandidateChart from '@/components/CostByCandidateChart';
import CostBySearchTypeChart from '@/components/CostBySearchTypeChart';
import TopCandidatesChart from '@/components/TopCandidatesChart';
import TemporalAnalysisChart from '@/components/TemporalAnalysisChart';
import UsageTable from '@/components/UsageTable';
import { DashboardStats, OpenAIUsage } from '@/types/openai-usage';
import { formatCost, formatNumber } from '@/lib/openai-pricing';
import { subDays, parseISO } from 'date-fns';
import { exportToCSV, exportToTextReport, downloadFile, generateExportSummary } from '@/lib/export-utils';

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [records, setRecords] = useState<OpenAIUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Auto-refresh configuration
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Date filters
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref para evitar procesar el mismo chunk dos veces (React StrictMode en desarrollo)
  const processedChunksRef = useRef<Set<string>>(new Set());
  const isStreamingRef = useRef<boolean>(false);
  const chunkCounterRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loggedChunksRef = useRef<Set<string>>(new Set()); // Para evitar logs duplicados

  // Memoized filtered records based on date range
  const filteredRecords = useMemo(() => 
    records.filter(record => {
      const recordDate = parseISO(record.timestamp);
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    }), [records, dateRange]
  );

  // Memoized fetch function with progressive loading
  const fetchData = useCallback(async () => {
    // Cancelar stream anterior si existe y resetear flags
    if (abortControllerRef.current) {
      console.log('🛑 Cancelando stream anterior...');
      abortControllerRef.current.abort();
      // Resetear flags inmediatamente para permitir nuevo stream
      isStreamingRef.current = false;
      processedChunksRef.current.clear();
      loggedChunksRef.current.clear();
      abortControllerRef.current = null;
    }
    
    // Evitar múltiples streams simultáneos (verificación atómica)
    if (isStreamingRef.current) {
      console.log('⚠️ Stream ya en progreso, ignorando nueva petición');
      return;
    }
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Crear nuevo AbortController para este stream
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      isStreamingRef.current = true;
      processedChunksRef.current.clear(); // Limpiar chunks procesados
      chunkCounterRef.current = 0; // Resetear contador de chunks
      loggedChunksRef.current.clear(); // Limpiar logs procesados
      
      // Timeout de seguridad: resetear flag después de 5 minutos si el stream se queda colgado
      timeoutId = setTimeout(() => {
        if (isStreamingRef.current) {
          console.warn('⚠️ Timeout: Stream colgado, reseteando flag');
          isStreamingRef.current = false;
          processedChunksRef.current.clear();
          loggedChunksRef.current.clear();
        }
      }, 5 * 60 * 1000); // 5 minutos
      
      setLoading(true);
      setLoadingProgress(0);
      setError(null);
      
      // Limpiar datos anteriores
      setStats(null);
      setRecords([]);
      
      // Usar la nueva API de streaming
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/usage-stream?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        signal: abortController.signal, // Permitir cancelación
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        if (timeoutId) clearTimeout(timeoutId);
        isStreamingRef.current = false; // Resetear flag antes de lanzar error
        processedChunksRef.current.clear();
        loggedChunksRef.current.clear();
        abortControllerRef.current = null; // Limpiar referencia
        throw new Error('Error en la respuesta del servidor');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        if (timeoutId) clearTimeout(timeoutId);
        isStreamingRef.current = false; // Resetear flag antes de lanzar error
        processedChunksRef.current.clear();
        loggedChunksRef.current.clear();
        abortControllerRef.current = null; // Limpiar referencia
        throw new Error('No se pudo obtener el reader del stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        // Verificar si el stream fue cancelado
        if (abortController.signal.aborted) {
          console.log('🛑 Stream cancelado por nueva petición');
          if (timeoutId) clearTimeout(timeoutId);
          isStreamingRef.current = false;
          processedChunksRef.current.clear();
          loggedChunksRef.current.clear();
          return;
        }
        
        const { done, value } = await reader.read();
        
        if (done) {
          // Stream terminado normalmente
          if (timeoutId) clearTimeout(timeoutId);
          isStreamingRef.current = false;
          processedChunksRef.current.clear();
          loggedChunksRef.current.clear();
          abortControllerRef.current = null; // Limpiar referencia
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              let rawData = JSON.parse(line.slice(6));
              
              // TODO: Implementar descompresión en el cliente con pako.js
              // Por ahora, manejar datos comprimidos como error
              if (rawData.compressed) {
                console.warn('Datos comprimidos recibidos pero descompresión no implementada en cliente');
                continue;
              }
              
              const data = rawData;
              
              // Crear hash único del contenido del chunk para evitar duplicados
              // Usamos una combinación de progress, totalRecords, y hash del contenido de newRecords
              const newRecordsHash = data.data?.newRecords 
                ? data.data.newRecords.length + '_' + 
                  (data.data.newRecords.map((r: any) => r.id || r.nombre || '').join(',').substring(0, 100))
                : 'empty';
              const chunkId = `${data.progress}_${data.data?.totalRecords || 0}_${newRecordsHash}`;
              
              if (processedChunksRef.current.has(chunkId)) {
                console.log(`⏭️ Chunk ya procesado (${data.progress}%), omitiendo...`);
                continue;
              }
              processedChunksRef.current.add(chunkId);
              
              if (!data.success) {
                throw new Error(data.error || 'Error al cargar los datos');
              }
              
              // Actualizar progreso
              setLoadingProgress(data.progress || 0);
              
              // ⚡ PROCESAR CHUNK INICIAL INMEDIATAMENTE (incluso si stats es null)
              if (data.data && !data.progressOnly) {
                // Actualizar stats (puede ser null en chunk inicial)
                if (data.data.stats) {
                  setStats(data.data.stats);
                }
                setIsDemoMode(data.demo || false);
                
                // ⚡ ACTUALIZAR PROGRESO INMEDIATAMENTE (incluso en chunk inicial)
                if (data.progress !== undefined) {
                  setLoadingProgress(data.progress);
                }
                
                // ⚡ MOSTRAR DATOS INMEDIATAMENTE cuando llegue el primer chunk (incluso sin datos)
                if (data.progress >= 0) {
                  setLoading(false); // Quitar skeleton loading inmediatamente
                }
                
                // Acumular nuevos registros incrementalmente (evitando duplicados)
                if (data.data.newRecords && data.data.newRecords.length > 0) {
                  // Crear función para generar ID único
                  const generateRecordId = (r: OpenAIUsage): string => {
                    if (r.id) return r.id;
                    if (r.nombre) return `${r.nombre}_${r.timestamp || 'unknown'}`;
                    const keyFields = {
                      timestamp: r.timestamp,
                      modelo_ai: r.modelo_ai,
                      nombre_candidato: r.nombre_candidato || r.nombre
                    };
                    return `hash_${JSON.stringify(keyFields)}`;
                  };
                  
                  // Usar el chunkId ya verificado para evitar logs duplicados
                  const logKey = `log_${chunkId}`;
                  if (!loggedChunksRef.current.has(logKey)) {
                    loggedChunksRef.current.add(logKey);
                    // El log se hace ANTES de setRecords para evitar duplicados
                    console.log(`⚡ Agregados ${data.data.newRecords.length} nuevos registros únicos (${data.progress}%)`);
                  }
                  
                  // Actualizar records
                  setRecords(prevRecords => {
                    const existingIds = new Set(prevRecords.map(generateRecordId));
                    const newUniqueRecords = data.data.newRecords.filter((r: OpenAIUsage) => {
                      const recordId = generateRecordId(r);
                      if (existingIds.has(recordId)) {
                        return false; // Ya existe, omitir
                      }
                      existingIds.add(recordId);
                      return true;
                    });
                    
                    return newUniqueRecords.length > 0 
                      ? [...prevRecords, ...newUniqueRecords]
                      : prevRecords;
                  });
                }
              }
              
              // Si es el último chunk, finalizar carga
              if (data.isComplete) {
                if (timeoutId) clearTimeout(timeoutId);
                setLoading(false);
                setLastRefresh(new Date());
                isStreamingRef.current = false; // Permitir nuevo stream
                processedChunksRef.current.clear(); // Limpiar chunks procesados
                loggedChunksRef.current.clear(); // Limpiar logs procesados
                abortControllerRef.current = null; // Limpiar referencia
              }
            } catch (parseError) {
              console.error('Error parsing chunk:', parseError);
            }
          }
        }
      }
      
      // Stream completado normalmente
      if (timeoutId) clearTimeout(timeoutId);
      isStreamingRef.current = false;
      processedChunksRef.current.clear();
      loggedChunksRef.current.clear();
      abortControllerRef.current = null; // Limpiar referencia
    } catch (err) {
      // Ignorar errores de abort
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 Stream abortado correctamente');
        return;
      }
      
      if (timeoutId) clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      isStreamingRef.current = false; // Resetear flag en caso de error
      processedChunksRef.current.clear();
      loggedChunksRef.current.clear();
      abortControllerRef.current = null; // Limpiar referencia
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Export functions
  const handleExportCSV = useCallback(() => {
    if (!stats) return;
    const csvContent = exportToCSV(filteredRecords, stats);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csvContent, `openai-costs-${timestamp}.csv`, 'text/csv');
  }, [filteredRecords, stats]);

  const handleExportReport = useCallback(() => {
    if (!stats) return;
    const reportContent = exportToTextReport(filteredRecords, stats);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(reportContent, `openai-report-${timestamp}.txt`, 'text/plain');
  }, [filteredRecords, stats]);

  const handleExportJSON = useCallback(() => {
    if (!stats) return;
    const summary = generateExportSummary(filteredRecords, stats);
    const jsonContent = JSON.stringify(summary, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(jsonContent, `openai-data-${timestamp}.json`, 'application/json');
  }, [filteredRecords, stats]);

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  );

  const SkeletonChart = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-4">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Error al cargar los datos
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Asegúrate de que las variables de entorno estén configuradas correctamente en el archivo <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code>
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow relative z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Dashboard de Costos OpenAI
                </h1>
                {isDemoMode && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                    MODO DEMO
                  </span>
                )}
                {autoRefresh && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    AUTO-REFRESH
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {isDemoMode 
                    ? 'Mostrando datos de ejemplo - Configura DynamoDB para datos reales'
                    : 'Análisis de uso y costos de la API de OpenAI'
                  }
                </span>
                {lastRefresh && (!loading && loadingProgress === 100) && (
                  <span className="text-xs">
                    Última actualización: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
                {!(!loading && loadingProgress === 100) && loadingProgress > 0 && (
                  <span className="text-xs flex items-center gap-3 text-blue-600 dark:text-blue-400 transition-all duration-300 relative z-[101]">
                    {/* Indicador circular con progreso */}
                    <div className="relative w-4 h-4">
                      <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-blue-200 dark:text-blue-800"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 10}`}
                          strokeDashoffset={`${2 * Math.PI * 10 * (1 - loadingProgress / 100)}`}
                          className="text-blue-500 transition-all duration-500 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="transition-all duration-300 flex items-center gap-2 relative z-[101]">
                      <span>Cargando datos...</span>
                      <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                        {loadingProgress}%
                      </span>
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Configuración"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {(loading || !(!loading && loadingProgress === 100)) && (
          <div className="relative">
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-full">
              {/* Barra de progreso principal con crecimiento lineal suave */}
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{ 
                  width: `${loadingProgress}%`,
                  transform: `scaleX(${loadingProgress / 100})`,
                  transformOrigin: 'left center',
                  boxShadow: loadingProgress > 0 ? '0 0 8px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              ></div>
              {/* Efecto de brillo animado que sigue el progreso */}
              <div 
                className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ 
                  left: `${Math.max(0, loadingProgress - 6)}%`,
                  opacity: loadingProgress > 5 && loadingProgress < 98 ? 0.8 : 0,
                  transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
                  animation: loadingProgress > 5 && loadingProgress < 98 ? 'shimmer 2s ease-in-out infinite' : 'none'
                }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Auto-refresh</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Activar</span>
                  </label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    disabled={!autoRefresh}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value={15000}>15s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>1min</option>
                    <option value={300000}>5min</option>
                  </select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Filtro de Fechas</h3>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-gray-500">a</span>
                  <input
                    type="date"
                    value={dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ease-out">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 relative">
          {!(!loading && loadingProgress === 100) && loadingProgress > 0 && (
            <div className="absolute -top-8 right-0 z-[200] bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-3 transition-all duration-500 animate-in slide-in-from-right-2 shadow-lg">
              <span className="transition-all duration-300 font-medium relative z-[201]">
                Cargando datos... 
                <span className="font-mono text-blue-600 dark:text-blue-400 ml-1">
                  {loadingProgress}%
                </span>
              </span>
            </div>
          )}
          <StatCard
            title="Costos"
            value={formatCost(stats.totalCost)}
            subtitle="Gasto acumulado"
            icon={
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Consultas"
            value={formatNumber(stats.totalRequests || 0)}
            subtitle="Llamadas a la API"
            icon={
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            title="Tokens"
            value={formatNumber(stats.totalTokens || 0)}
            subtitle={`${formatNumber(stats.totalInputTokens || 0)} in • ${formatNumber(stats.totalOutputTokens || 0)} out`}
            icon={
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
          <StatCard
            title="Costo %"
            value={formatCost((stats.totalRequests && stats.totalRequests > 0) ? (stats.totalCost / stats.totalRequests) : 0)}
            subtitle="Por consulta"
            icon={
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Eficiencia"
            value={`${stats.totalOutputTokens && stats.totalInputTokens ? (stats.totalOutputTokens / stats.totalInputTokens).toFixed(2) : '0.00'}x`}
            subtitle="Ratio salida/entrada"
            icon={
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Charts Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DailyCostChart data={stats.dailyCosts} />
          <CostByModelChart data={stats.costByModel} />
        </div>

        {/* Sección: Ranking de Candidatos y Análisis por Tipo de Búsqueda */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Análisis Detallado
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TopCandidatesChart 
            data={stats.costByCandidate} 
            requestsByCandidate={stats.requestsByCandidate}
          />
          <CostBySearchTypeChart 
            data={stats.costBySearchType}
            requestsByType={stats.requestsBySearchType}
            records={records}
          />
        </div>

        {/* Sección: Análisis Temporal */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">📅</span>
            Análisis Temporal
          </h2>
        </div>

        <div className="mb-8">
          <TemporalAnalysisChart 
            dailyCosts={stats.dailyCosts}
            requestsByDay={stats.requestsByDay}
          />
        </div>

        {/* Distribución por Candidato (Gráfico Original) */}
        <div className="mb-8">
          <CostByCandidateChart data={stats.costByCandidate} />
        </div>

        {/* Usage Table */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-3xl">📋</span>
              Registros Detallados
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Mostrando {filteredRecords.length} de {records.length} registros
                  {loading && loadingProgress > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 ml-2">
                      (cargando más...)
                    </span>
                  )}
                </span>
                {filteredRecords.length !== records.length && (!loading || loadingProgress === 100) && (
                  <button
                    onClick={() => setDateRange({ start: subDays(new Date(), 365), end: new Date() })}
                    className="ml-2 text-blue-500 hover:text-blue-600 underline"
                  >
                    Ver todos
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={!stats || filteredRecords.length === 0}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Exportar a CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={handleExportReport}
                  disabled={!stats || filteredRecords.length === 0}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Exportar Reporte"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reporte
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={!stats || filteredRecords.length === 0}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Exportar JSON"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
        <UsageTable records={filteredRecords} />
      </main>
    </div>
  );
}

