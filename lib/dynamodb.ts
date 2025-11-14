import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
 */
export async function getAllUsageRecords(): Promise<OpenAIUsage[]> {
  const client = getClient();
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME no está configurado');
  }
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    return (response.Items as OpenAIUsage[]) || [];
  } catch (error) {
    console.error('Error al obtener datos de DynamoDB:', error);
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

