import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { OpenAIUsage } from '@/types/openai-usage';

let client: DynamoDBDocumentClient | null = null;

/**
 * Inicializa el cliente de DynamoDB
 */
function getClient(): DynamoDBDocumentClient {
  if (!client) {
    const clientInitStart = Date.now();
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${timestamp}] 🔧 Inicializando cliente DynamoDB...`);
    
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    
    client = DynamoDBDocumentClient.from(dynamoClient);
    const clientInitTime = Date.now() - clientInitStart;
    console.log(`[${timestamp}] ✅ Cliente DynamoDB inicializado en ${clientInitTime}ms`);
  }
  
  return client;
}


/**
 * Valida que no haya duplicados en un array de registros
 */
function validateNoDuplicates(records: OpenAIUsage[], source: string): { isValid: boolean; duplicates: number; uniqueIds: number } {
  const seenIds = new Set<string>();
  let duplicates = 0;
  
  records.forEach((record, index) => {
    const recordId = record.id || record.nombre || `record_${index}`;
    
    if (seenIds.has(recordId)) {
      duplicates++;
      console.warn(`⚠️ Duplicado en ${source}: ${recordId}`);
    } else {
      seenIds.add(recordId);
    }
  });
  
  const result = {
    isValid: duplicates === 0,
    duplicates,
    uniqueIds: seenIds.size
  };
  
  if (result.isValid) {
    console.log(`✅ ${source}: Sin duplicados - ${result.uniqueIds} registros únicos`);
  } else {
    console.error(`❌ ${source}: ${duplicates} duplicados encontrados de ${records.length} registros`);
  }
  
  return result;
}


/**
 * Obtiene registros de uso de OpenAI desde DynamoDB
 * Usa parallel scans optimizados para máxima velocidad con callback progresivo
 * @param onProgress - Callback para reportar progreso
 * @param sinceTimestamp - (Opcional) Solo traer registros posteriores a este timestamp
 */
export async function getUsageRecords(
  onProgress: (records: OpenAIUsage[], progress: number, isComplete: boolean, totalExpected: number) => void,
  sinceTimestamp?: string
): Promise<OpenAIUsage[]> {
  const client = getClient();
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME no está configurado');
  }
  
  try {
    const allItems: OpenAIUsage[] = [];
    
    // Función helper para logs con timestamp
    const logWithTime = (message: string) => {
      const now = new Date();
      const timestamp = now.toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
      console.log(`[${timestamp}] ${message}`);
    };

    // NO hacer count separado - usar los datos reales conforme van llegando
    const isIncremental = !!sinceTimestamp;
    if (isIncremental) {
      logWithTime(`🔄 Carga INCREMENTAL: Solo registros posteriores a ${sinceTimestamp}`);
    } else {
      logWithTime('🚀 Iniciando carga COMPLETA (primera vez)...');
    }
    
    // ⚡ CALLBACK INMEDIATO: Mostrar estado inicial
    const startTime = Date.now();
    logWithTime('⚡ CALLBACK INICIAL: Enviando 1% inicial...');
    onProgress([], 1, false, 1000); // 1% inicial para mostrar que empezó
    logWithTime(`✅ Callback inicial enviado en ${Date.now() - startTime}ms`);
    
    // Estimación inicial que se ajustará dinámicamente
    let estimatedTotal = 1000; // Se actualizará conforme lleguen datos
    
    // Configuración optimizada para máximo throughput de DynamoDB
    // DynamoDB tiene límite de 1MB por scan, no límite fijo de items
    // Removemos Limit para que DynamoDB devuelva el máximo posible (hasta 1MB)
    const PARALLEL_SCANS = 20; // Máximo segmentos paralelos para throughput óptimo (aumentado a 20)
    
    // Función para hacer scan paralelo
    const performParallelScan = async (segment: number, totalSegments: number) => {
      let segmentItems: OpenAIUsage[] = [];
      let segmentLastKey: Record<string, any> | undefined = undefined;
      let segmentScanCount = 0;
      
      do {
        segmentScanCount++;
        const scanStartTime = Date.now();
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`[${timestamp}] 📊 Segmento ${segment + 1}/${totalSegments} - Scan #${segmentScanCount}`);
        
        // Construir comando con filtro opcional
        const scanParams: any = {
          TableName: tableName,
          ExclusiveStartKey: segmentLastKey,
          // NO especificamos Limit - DynamoDB devolverá el máximo posible (hasta 1MB)
          Segment: segment,
          TotalSegments: totalSegments
        };
        
        // Si es carga incremental, filtrar por timestamp
        if (sinceTimestamp) {
          scanParams.FilterExpression = '#ts > :since';
          scanParams.ExpressionAttributeNames = {
            '#ts': 'timestamp'
          };
          scanParams.ExpressionAttributeValues = {
            ':since': sinceTimestamp
          };
        }
        
        const command: ScanCommand = new ScanCommand(scanParams);
        
        const response: ScanCommandOutput = await client.send(command);
        const scanTime = Date.now() - scanStartTime;
        
        if (response.Items && response.Items.length > 0) {
          const newItems = response.Items as OpenAIUsage[];
          segmentItems.push(...newItems);
          
          // Calcular tamaño aproximado en KB para monitorear el límite de 1MB
          const avgItemSize = JSON.stringify(newItems[0] || {}).length;
          const batchSizeKB = Math.round((newItems.length * avgItemSize) / 1024);
          
          console.log(`[${timestamp}]   ✅ Segmento ${segment + 1}: +${newItems.length} registros (~${batchSizeKB}KB) en ${scanTime}ms - Total segmento: ${segmentItems.length}`);
          
          // Log si estamos cerca del límite de 1MB (1024KB)
          if (batchSizeKB > 800) {
            console.log(`[${timestamp}]     🔥 Batch grande detectado: ${batchSizeKB}KB (cerca del límite de 1MB)`);
          }
        }
        
        segmentLastKey = response.LastEvaluatedKey;
        
      } while (segmentLastKey);
      
      return segmentItems;
    };
    
    // Ejecutar scans paralelos
    const scanPromises: Promise<OpenAIUsage[]>[] = [];
    for (let segment = 0; segment < PARALLEL_SCANS; segment++) {
      scanPromises.push(performParallelScan(segment, PARALLEL_SCANS));
    }
    
    // ⚡ CALLBACK INMEDIATO: Indicar que los scans han empezado
    logWithTime('🚀 Scans paralelos iniciados - enviando callback de inicio...');
    onProgress([], 2, false, estimatedTotal); // 2% para indicar que los scans empezaron
    
    // Procesar resultados conforme van llegando (INMEDIATAMENTE SIN BLOQUEOS)
    let completedSegments = 0;
    // Usar Map para detección de duplicados más robusta (clave: ID, valor: registro)
    const seenRecords = new Map<string, OpenAIUsage>(); // Para detectar duplicados y mantener referencia
    
    // Función helper para verificar y agregar registro de forma segura
    const addRecordSafely = (item: OpenAIUsage, itemId: string): boolean => {
      // Verificar si ya existe
      if (seenRecords.has(itemId)) {
        return false; // Ya existe
      }
      // Agregar al Map (operación atómica en JavaScript single-threaded)
      seenRecords.set(itemId, item);
      return true; // Agregado exitosamente
    };
    
    // ⚡ PROCESAMIENTO INMEDIATO: Cada segmento se procesa independientemente
    scanPromises.forEach(async (promise, index) => {
      try {
        const segmentStartTime = Date.now();
        logWithTime(`🚀 Iniciando segmento ${index + 1}/${PARALLEL_SCANS}...`);
        const segmentItems = await promise;
        const segmentEndTime = Date.now();
        logWithTime(`⚡ Segmento ${index + 1} TERMINÓ con ${segmentItems.length} registros en ${segmentEndTime - segmentStartTime}ms - PROCESANDO INMEDIATAMENTE`);
        
        // Validar duplicados antes de agregar (thread-safe con operación atómica)
        const newItems: OpenAIUsage[] = [];
        let duplicatesFound = 0;
        
        segmentItems.forEach(item => {
          // Generar ID único de forma robusta y optimizada (evitar JSON.stringify cuando sea posible)
          let itemId: string;
          if (item.id) {
            itemId = item.id;
          } else if (item.nombre) {
            // Combinar nombre con timestamp para mayor unicidad
            itemId = `${item.nombre}_${item.timestamp || 'unknown'}`;
          } else {
            // Usar concatenación directa en lugar de JSON.stringify para mejor rendimiento
            itemId = `hash_${item.timestamp || ''}_${item.modelo_ai || ''}_${item.nombre_candidato || item.nombre || ''}`;
          }
          
          // Verificar y agregar de forma segura
          if (addRecordSafely(item, itemId)) {
            newItems.push(item);
          } else {
            duplicatesFound++;
            // Solo loguear duplicados si hay muchos (reducir logs)
            if (duplicatesFound <= 3) {
              logWithTime(`⚠️ Duplicado detectado en segmento ${index + 1}: ${itemId.substring(0, 50)}...`);
            }
          }
        });
        
        // Actualizar datos compartidos de forma atómica
        allItems.push(...newItems);
        completedSegments++;
        
        // Log de validación
        if (duplicatesFound > 0) {
          logWithTime(`❌ ALERTA: ${duplicatesFound} duplicados encontrados en segmento ${index + 1}`);
        } else {
          logWithTime(`✅ Segmento ${index + 1}: Sin duplicados - ${newItems.length} registros únicos`);
        }
        
        // Cálculo de progreso lineal mejorado para 10 segmentos
        const segmentProgress = (completedSegments / PARALLEL_SCANS) * 100;
        
        logWithTime(`📊 Segmento ${index + 1}/${PARALLEL_SCANS} completado: ${segmentItems.length} registros`);
        logWithTime(`📊 Total acumulado: ${allItems.length} registros`);
        
        // Estimación dinámica desde el PRIMER segmento
        if (completedSegments >= 1) {
          const avgRecordsPerSegment = allItems.length / completedSegments;
          const newEstimate = Math.round(avgRecordsPerSegment * PARALLEL_SCANS);
          
          // Actualización más frecuente para transición más suave
          if (Math.abs(newEstimate - estimatedTotal) > estimatedTotal * 0.05 || completedSegments === 1) {
            estimatedTotal = newEstimate;
            logWithTime(`📊 Estimación actualizada (${completedSegments}/${PARALLEL_SCANS} segmentos): ${estimatedTotal} registros`);
          }
        }
        
        // Progreso híbrido más suave: combina segmentos completados y datos acumulados
        const dataProgress = estimatedTotal > 0 
          ? Math.min(Math.round((allItems.length / estimatedTotal) * 100), 98)
          : 0;
        
        // Progreso lineal suavizado: peso mayor a datos reales conforme avanza
        const segmentWeight = Math.max(0.2, 1 - (completedSegments / PARALLEL_SCANS));
        const dataWeight = 1 - segmentWeight;
        const smoothProgress = Math.round((segmentProgress * segmentWeight) + (dataProgress * dataWeight));
        
        const isComplete = completedSegments === PARALLEL_SCANS;
        const finalProgress = isComplete ? 100 : Math.min(smoothProgress, 98);
        
        logWithTime(`📈 Progreso INMEDIATO: ${finalProgress}% (segmentos: ${segmentProgress.toFixed(1)}%, datos: ${dataProgress}%, suavizado: ${smoothProgress}%)`);
        
        // ⚡ CALLBACK INMEDIATO - SIN AWAIT, SIN BLOQUEOS
        const callbackStartTime = Date.now();
        logWithTime(`🚀 ENVIANDO CALLBACK INMEDIATO para segmento ${index + 1}...`);
        onProgress([...allItems], finalProgress, isComplete, estimatedTotal);
        const callbackEndTime = Date.now();
        logWithTime(`✅ Callback enviado para segmento ${index + 1} en ${callbackEndTime - callbackStartTime}ms`);
        
      } catch (error) {
        logWithTime(`❌ Error en segmento ${index + 1}: ${error}`);
      }
    });
    
    // ⚡ ESPERA NO BLOQUEANTE: Solo para el return final, callbacks ya enviados
    await Promise.allSettled(scanPromises);
    
    // Usar el total real de registros obtenidos
    estimatedTotal = allItems.length;
    const totalTime = Date.now() - startTime;
    
    logWithTime(`✅ Scan paralelo completo: ${allItems.length} registros totales en ${totalTime}ms`);
    logWithTime(`📊 Total exacto: ${allItems.length} registros (SIN count separado - más eficiente)`);
    logWithTime(`🚀 Configuración: ${PARALLEL_SCANS} segmentos paralelos, sin límite de items (máximo 1MB/segmento)`);
    logWithTime(`🔍 Validación: ${seenRecords.size} IDs únicos procesados (${allItems.length === seenRecords.size ? 'SIN DUPLICADOS' : 'DUPLICADOS DETECTADOS'})`);
    logWithTime(`⚡ Throughput promedio: ${Math.round(allItems.length / (totalTime / 1000))} registros/segundo`);
    
    // Validación final de integridad
    const validation = validateNoDuplicates(allItems, 'Resultado Final');
    if (!validation.isValid) {
      logWithTime(`🚨 ALERTA CRÍTICA: Se encontraron ${validation.duplicates} duplicados en el resultado final`);
    }
    
    return allItems;
    
  } catch (error) {
    console.error('❌ Error al obtener datos progresivos de DynamoDB:', error);
    throw new Error('Error al conectar con DynamoDB');
  }
}

/**
 * Obtiene registros filtrados por rango de fechas
 */

