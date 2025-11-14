'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import CostByModelChart from '@/components/CostByModelChart';
import DailyCostChart from '@/components/DailyCostChart';
import CostByCandidateChart from '@/components/CostByCandidateChart';
import UsageTable from '@/components/UsageTable';
import { DashboardStats, OpenAIUsage } from '@/types/openai-usage';
import { formatCost } from '@/lib/openai-pricing';

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [records, setRecords] = useState<OpenAIUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Agregar timestamp para evitar caché y headers no-cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/usage?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar los datos');
      }

      setStats(data.data.stats);
      setRecords(data.data.records);
      setIsDemoMode(data.demo || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
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
      <header className="bg-white dark:bg-gray-800 shadow">
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
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {isDemoMode 
                  ? 'Mostrando datos de ejemplo - Configura DynamoDB para datos reales'
                  : 'Análisis de uso y costos de la API de OpenAI'
                }
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Costo Total"
            value={formatCost(stats.totalCost)}
            subtitle="Gasto acumulado"
            icon={
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Total Consultas"
            value={stats.totalRequests.toLocaleString()}
            subtitle="Llamadas a la API"
            icon={
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            title="Tokens Totales"
            value={stats.totalTokens.toLocaleString()}
            subtitle={`${stats.totalInputTokens.toLocaleString()} entrada / ${stats.totalOutputTokens.toLocaleString()} salida`}
            icon={
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
          <StatCard
            title="Costo Promedio"
            value={formatCost(stats.totalCost / stats.totalRequests)}
            subtitle="Por consulta"
            icon={
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DailyCostChart data={stats.dailyCosts} />
          <CostByModelChart data={stats.costByModel} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CostByCandidateChart data={stats.costByCandidate} />
          
          {/* Cost by Search Type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Costos por Tipo de Búsqueda
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.costBySearchType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, cost]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-1">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{
                            width: `${(cost / stats.totalCost) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 min-w-[120px] text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCost(cost)} ({((cost / stats.totalCost) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Usage Table */}
        <UsageTable records={records} />
      </main>
    </div>
  );
}

