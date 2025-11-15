import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { OpenAIUsage } from '@/types/openai-usage';

let client: DynamoDBDocumentClient | null = null;

/**
 * Inicializa el cliente de DynamoDB
 */
function getClient(): DynamoDBDocumentClient {
  if (!client) {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    
    client = DynamoDBDocumentClient.from(dynamoClient);
  }
  
  return client;
}

/**
 * Obtiene todos los registros de uso de OpenAI desde DynamoDB
 * Maneja la paginación automáticamente para obtener TODOS los registros
 */
export async function getAllUsageRecords(): Promise<OpenAIUsage[]> {
  const client = getClient();
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME no está configurado');
  }
  
  try {
    const allItems: OpenAIUsage[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    let scanCount = 0;
    
    // Loop para manejar la paginación de DynamoDB
    do {
      scanCount++;
      console.log(`📊 DynamoDB Scan #${scanCount}${lastEvaluatedKey ? ' (paginación...)' : ''}`);
      
      const command: ScanCommand = new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey, // Continúa desde donde quedó
      });
      
      const response: ScanCommandOutput = await client.send(command);
      
      // Agregar items de esta página
      if (response.Items && response.Items.length > 0) {
        allItems.push(...(response.Items as OpenAIUsage[]));
        console.log(`  ✅ Obtenidos ${response.Items.length} registros (Total acumulado: ${allItems.length})`);
      }
      
      // Si hay LastEvaluatedKey, significa que hay más páginas
      lastEvaluatedKey = response.LastEvaluatedKey;
      
    } while (lastEvaluatedKey); // Continúa mientras haya más páginas
    
    console.log(`✅ Scan completo: ${allItems.length} registros totales en ${scanCount} página(s)`);
    return allItems;
    
  } catch (error) {
    console.error('❌ Error al obtener datos de DynamoDB:', error);
    throw new Error('Error al conectar con DynamoDB');
  }
}

/**
 * Obtiene registros filtrados por rango de fechas
 */
export async function getUsageRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<OpenAIUsage[]> {
  const allRecords = await getAllUsageRecords();
  
  return allRecords.filter(record => {
    const recordDate = new Date(record.timestamp);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return recordDate >= start && recordDate <= end;
  });
}

