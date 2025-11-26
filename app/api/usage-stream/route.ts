import { NextResponse } from 'next/server';
import { getUsageRecords } from '@/lib/dynamodb';
import { calculateDashboardStats, calculateIncrementalStats } from '@/lib/stats';
import { DashboardStats } from '@/types/openai-usage';
import { mockUsageData, isDemoMode } from '@/lib/mock-data';
import { checkPricingFreshness } from '@/lib/openai-pricing';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

// Configuración para forzar ejecución dinámica (sin caché)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Si está en modo demo, usar datos de prueba
    if (isDemoMode()) {
      console.log('🔧 Modo Demo: Usando datos de ejemplo con simulación de carga progresiva');
      
      // Simular carga progresiva lineal con datos de ejemplo
      const totalRecords = mockUsageData.length;
      const totalSteps = 20; // Más pasos para transición más suave
      const recordsPerStep = Math.max(1, Math.floor(totalRecords / totalSteps));
      
      return new Response(
        new ReadableStream({
          async start(controller) {
            let currentRecords = 0;
            
            for (let step = 1; step <= totalSteps; step++) {
              // Calcular cuántos registros mostrar en este paso
              const targetRecords = Math.min(
                Math.floor((step / totalSteps) * totalRecords),
                totalRecords
              );
              
              // Si no hay cambio en registros, solo actualizar progreso
              if (targetRecords > currentRecords || step === totalSteps) {
                currentRecords = targetRecords;
                const currentBatch = mockUsageData.slice(0, currentRecords);
                const stats = calculateDashboardStats(currentBatch);
                
                const chunk = {
                  success: true,
                  demo: true,
                  progress: Math.round((step / totalSteps) * 100),
                  isComplete: step === totalSteps,
                  data: {
                    stats,
                    records: currentBatch,
                    totalRecords: currentBatch.length,
                    expectedTotal: totalRecords
                  }
                };
                
                controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
              } else {
                // Solo actualizar progreso sin cambiar datos
                const chunk = {
                  success: true,
                  demo: true,
                  progress: Math.round((step / totalSteps) * 100),
                  isComplete: step === totalSteps,
                  progressOnly: true
                };
                
                controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
              }
              
              // Delay más corto para transición más suave
              if (step < totalSteps) {
                await new Promise(resolve => setTimeout(resolve, 150));
              }
            }
            
            controller.close();
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Modo producción: obtener datos de DynamoDB progresivamente
    const streamStartTime = Date.now();
    const streamStartTimestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${streamStartTimestamp}] ⚡ GET /api/usage-stream - Stream creado en ${Date.now() - streamStartTime}ms`);
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          const streamInitTime = Date.now();
          const streamInitTimestamp = new Date().toISOString().split('T')[1].slice(0, -1);
          console.log(`[${streamInitTimestamp}] ⚡ Stream.start() ejecutado en ${streamInitTime - streamStartTime}ms desde GET`);
          
          let controllerClosed = false;
          
          const safeEnqueue = (data: string) => {
            if (!controllerClosed) {
              try {
                controller.enqueue(data);
              } catch (error) {
                console.warn('⚠️ Controller ya cerrado, ignorando enqueue:', error);
                controllerClosed = true;
              }
            }
          };
          
          const safeClose = () => {
            if (!controllerClosed) {
              try {
                controller.close();
                controllerClosed = true;
              } catch (error) {
                console.warn('⚠️ Controller ya cerrado, ignorando close:', error);
                controllerClosed = true;
              }
            }
          };
          
          try {
            // ⚡ ENVIAR CHUNK INICIAL INMEDIATAMENTE (antes de cualquier operación pesada)
            const chunkInitStart = Date.now();
            const initialChunk: {
              success: boolean;
              demo: boolean;
              progress: number;
              isComplete: boolean;
              data: {
                stats: DashboardStats | null;
                newRecords: any[];
                totalRecords: number;
                expectedTotal: number;
              };
            } = {
              success: true,
              demo: false,
              progress: 0,
              isComplete: false,
              data: {
                stats: null,
                newRecords: [],
                totalRecords: 0,
                expectedTotal: 0
              }
            };
            safeEnqueue(`data: ${JSON.stringify(initialChunk)}\n\n`);
            const chunkInitTime = Date.now() - chunkInitStart;
            console.log(`[${streamInitTimestamp}] ⚡ Chunk inicial enviado en ${chunkInitTime}ms (${Date.now() - streamStartTime}ms desde GET)`);
            
            console.log(`[${streamInitTimestamp}] 🚀 Iniciando carga progresiva real de DynamoDB...`);
            
            // Estado para stats incrementales
            let previousStats: DashboardStats | null = null;
            let previousRecordsCount = 0;
            
            // Verificar precios de forma asíncrona en paralelo (no bloquea el stream)
            Promise.resolve().then(() => {
              const pricingCheckStart = Date.now();
              checkPricingFreshness();
              const pricingCheckTime = Date.now() - pricingCheckStart;
              console.log(`[${streamInitTimestamp}] 📊 Verificación de precios en ${pricingCheckTime}ms`);
            });
            
            // Usar la nueva función progresiva optimizada (no esperar pricing check)
            const dynamoStartTime = Date.now();
            console.log(`[${streamInitTimestamp}] ⚡ Llamando getUsageRecords en ${dynamoStartTime - streamStartTime}ms desde GET`);
            await getUsageRecords(async (records, progress, isComplete, totalExpected) => {
              const callbackStart = Date.now();
              const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
              console.log(`[${timestamp}] ⚡ CALLBACK RECIBIDO: ${records.length} registros, ${progress}% - Procesando...`);
              
              if (controllerClosed) {
                console.log('⚠️ Controller cerrado, ignorando callback');
                return;
              }
              
              const statsStart = Date.now();
              
              // Calcular solo los nuevos registros (incremental)
              const newRecords = records.slice(previousRecordsCount);
              const stats = calculateIncrementalStats(previousStats, newRecords);
              
              // Actualizar estado para próximo callback
              previousStats = stats;
              previousRecordsCount = records.length;
              
              const statsTime = Date.now() - statsStart;
              console.log(`[${timestamp}] 📊 Stats incrementales calculadas en ${statsTime}ms (${newRecords.length} nuevos registros)`);
              
              const chunk = {
                success: true,
                demo: false,
                progress,
                isComplete,
                data: {
                  stats,
                  newRecords, // Solo enviar nuevos registros (delta)
                  totalRecords: records.length,
                  expectedTotal: totalExpected,
                  // NUNCA enviar dataset completo - el frontend acumula incrementalmente
                  records: []
                }
              };
              
              const serializeStart = Date.now();
              const serializedChunk = JSON.stringify(chunk);
              const serializeTime = Date.now() - serializeStart;
              
              // Comprimir solo chunks grandes (>1KB) - DESHABILITADO por ahora
              const originalSize = serializedChunk.length;
              let finalChunk = serializedChunk;
              let compressionTime = 0;
              
              if (false && originalSize > 1024) { // Deshabilitado temporalmente
                const compressStart = Date.now();
                try {
                  const compressed = await gzipAsync(serializedChunk);
                  const compressedB64 = compressed.toString('base64');
                  finalChunk = JSON.stringify({
                    compressed: true,
                    data: compressedB64
                  });
                  compressionTime = Date.now() - compressStart;
                  
                  const compressionRatio = ((originalSize - finalChunk.length) / originalSize * 100).toFixed(1);
                  console.log(`[${timestamp}] 🗜️ Compresión: ${Math.round(originalSize / 1024)}KB → ${Math.round(finalChunk.length / 1024)}KB (${compressionRatio}% reducción)`);
                } catch (error) {
                  console.warn(`[${timestamp}] ⚠️ Error en compresión, enviando sin comprimir:`, error);
                  finalChunk = serializedChunk;
                }
              }
              
              console.log(`[${timestamp}] 🔄 Serialización en ${serializeTime}ms + compresión ${compressionTime}ms (${Math.round(finalChunk.length / 1024)}KB)`);
              
              const sendStart = Date.now();
              console.log(`[${timestamp}] 📊 Enviando chunk: ${records.length}/${totalExpected} registros, ${progress}% completo`);
              safeEnqueue(`data: ${finalChunk}\n\n`);
              const sendTime = Date.now() - sendStart;
              
              const totalTime = Date.now() - callbackStart;
              console.log(`[${timestamp}] ⚡ Callback completado en ${totalTime}ms total (stats: ${statsTime}ms, serialize: ${serializeTime}ms, compress: ${compressionTime}ms, send: ${sendTime}ms)`);
              
              if (isComplete) {
                console.log(`[${timestamp}] ✅ Carga progresiva optimizada completada`);
                safeClose();
              }
            });
            
          } catch (error) {
            console.error('❌ Error en carga progresiva:', error);
            
            if (!controllerClosed) {
              const errorChunk = {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
                progress: 0,
                isComplete: true
              };
              
              safeEnqueue(`data: ${JSON.stringify(errorChunk)}\n\n`);
              safeClose();
            }
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error en API de streaming:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
