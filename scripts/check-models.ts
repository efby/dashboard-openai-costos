/**
 * Script para verificar los modelos en los últimos registros de DynamoDB
 * Identifica qué modelos NO están en la tabla de precios
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env.local') });

// Precios de OpenAI por millón de tokens (copiado de lib/openai-pricing.ts)
const MODEL_PRICING: Record<string, [number, number]> = {
  // GPT-4o models
  'gpt-4o': [2.50, 10.0],
  'gpt-4o-mini': [0.15, 0.60],
  'gpt-4o-2024-11-20': [2.50, 10.0],
  'gpt-4o-2024-08-06': [2.50, 10.0],
  'gpt-4o-2024-05-13': [5.0, 15.0],
  'gpt-4o-mini-2024-07-18': [0.15, 0.60],
  
  // GPT-4 Turbo models
  'gpt-4-turbo': [10.0, 30.0],
  'gpt-4-turbo-preview': [10.0, 30.0],
  'gpt-4-turbo-2024-04-09': [10.0, 30.0],
  'gpt-4-1106-preview': [10.0, 30.0],
  'gpt-4-0125-preview': [10.0, 30.0],
  
  // GPT-4.1
  'gpt-4.1': [3.0, 12.0],
  'gpt-4.1-2025-04-14': [3.0, 12.0],
  
  // GPT-5.1
  'gpt-5.1-2025-11-13': [2.5, 10.0],
  
  // GPT-4 legacy
  'gpt-4': [30.0, 60.0],
  'gpt-4-32k': [60.0, 120.0],
  'gpt-4-0613': [30.0, 60.0],
  'gpt-4-32k-0613': [60.0, 120.0],
  
  // GPT-3.5 models
  'gpt-3.5-turbo': [0.50, 1.50],
  'gpt-3.5-turbo-0125': [0.50, 1.50],
  'gpt-3.5-turbo-1106': [1.0, 2.0],
  'gpt-3.5-turbo-16k': [3.0, 4.0],
  'gpt-3.5-turbo-instruct': [1.50, 2.0],
  
  // O1 models
  'o1-preview': [15.0, 60.0],
  'o1-preview-2024-09-12': [15.0, 60.0],
  'o1-mini': [3.0, 12.0],
  'o1-mini-2024-09-12': [3.0, 12.0],
};

async function checkModels() {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  
  if (!tableName) {
    console.error('❌ DYNAMODB_TABLE_NAME no está configurado en .env.local');
    process.exit(1);
  }

  console.log('🔍 Conectando a DynamoDB...');
  console.log(`📊 Tabla: ${tableName}\n`);

  // Crear cliente DynamoDB
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const docClient = DynamoDBDocumentClient.from(client);

  try {
    // Obtener los últimos 50 registros
    console.log('📥 Obteniendo últimos registros...\n');
    
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 50, // Solo los últimos 50 para análisis rápido
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    if (items.length === 0) {
      console.log('⚠️ No se encontraron registros en la tabla');
      return;
    }

    console.log(`✅ Encontrados ${items.length} registros\n`);
    
    // Verificar estructura de usage
    let recordsWithoutUsage = 0;
    let recordsWithZeroTokens = 0;
    let recordsWithNullTokens = 0;
    const problemRecords: any[] = [];
    
    items.forEach(record => {
      const hasUsage = !!record.usage;
      if (!hasUsage) {
        recordsWithoutUsage++;
        problemRecords.push({
          id: record.id,
          modelo: record.modelo_ai,
          candidato: record.nombre || record.nombre_candidato,
          timestamp: record.timestamp,
          problem: 'Sin estructura usage'
        });
        return;
      }
      
      const inputTokens = record.usage?.input_tokens;
      const outputTokens = record.usage?.output_tokens;
      const totalTokens = record.usage?.total_tokens;
      
      // Detectar null/undefined en tokens
      if (inputTokens === null || inputTokens === undefined || 
          outputTokens === null || outputTokens === undefined ||
          totalTokens === null || totalTokens === undefined) {
        recordsWithNullTokens++;
        problemRecords.push({
          id: record.id,
          modelo: record.modelo_ai,
          candidato: record.nombre || record.nombre_candidato,
          timestamp: record.timestamp,
          problem: 'Tokens null/undefined',
          usage: record.usage
        });
        return;
      }
      
      // Detectar todos los tokens en 0
      if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
        recordsWithZeroTokens++;
        problemRecords.push({
          id: record.id,
          modelo: record.modelo_ai,
          candidato: record.nombre || record.nombre_candidato,
          timestamp: record.timestamp,
          problem: 'Todos los tokens en 0',
          usage: record.usage
        });
      }
    });
    
    console.log('═'.repeat(80));
    console.log('ANÁLISIS DE ESTRUCTURA DE DATOS');
    console.log('═'.repeat(80));
    console.log(`\n📊 Resumen de ${items.length} registros:`);
    console.log(`   ✓ Registros válidos: ${items.length - problemRecords.length}`);
    console.log(`   ✗ Registros sin estructura usage: ${recordsWithoutUsage}`);
    console.log(`   ✗ Registros con tokens null/undefined: ${recordsWithNullTokens}`);
    console.log(`   ⚠️ Registros con todos los tokens en 0: ${recordsWithZeroTokens}`);
    
    if (problemRecords.length > 0) {
      console.log(`\n⚠️ REGISTROS CON PROBLEMAS (primeros 10):`);
      console.log('-'.repeat(80));
      problemRecords.slice(0, 10).forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.problem}`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Modelo: ${record.modelo}`);
        console.log(`   Candidato: ${record.candidato}`);
        console.log(`   Timestamp: ${record.timestamp}`);
        if (record.usage) {
          console.log(`   Usage: ${JSON.stringify(record.usage, null, 2).split('\n').join('\n   ')}`);
        }
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('ANÁLISIS DE MODELOS');
    console.log('═'.repeat(80));

    // Agrupar por modelo
    const modelStats = new Map<string, {
      count: number;
      inPricing: boolean;
      matchType: 'exact' | 'prefix' | 'none';
      sampleRecord: any;
    }>();

    items.forEach(record => {
      const modelo = record.modelo_ai;
      
      if (!modelo) {
        console.warn(`⚠️ Registro sin modelo_ai: ${record.id || 'sin ID'}`);
        return;
      }

      if (!modelStats.has(modelo)) {
        // Verificar si está en pricing (exacto)
        let inPricing = !!MODEL_PRICING[modelo];
        let matchType: 'exact' | 'prefix' | 'none' = 'none';

        if (inPricing) {
          matchType = 'exact';
        } else {
          // Verificar si hay match por prefijo
          const prefixMatch = Object.keys(MODEL_PRICING).find(key =>
            modelo.toLowerCase().startsWith(key.toLowerCase())
          );
          if (prefixMatch) {
            inPricing = true;
            matchType = 'prefix';
          }
        }

        modelStats.set(modelo, {
          count: 0,
          inPricing,
          matchType,
          sampleRecord: record
        });
      }

      const stats = modelStats.get(modelo)!;
      stats.count++;
    });

    // Separar modelos en categorías
    const modelsWithPricing: Array<[string, any]> = [];
    const modelsWithoutPricing: Array<[string, any]> = [];

    modelStats.forEach((stats, modelo) => {
      if (stats.inPricing) {
        modelsWithPricing.push([modelo, stats]);
      } else {
        modelsWithoutPricing.push([modelo, stats]);
      }
    });

    // Mostrar modelos CON precio
    console.log('\n✅ MODELOS CON PRECIO DEFINIDO:');
    console.log('-'.repeat(80));
    if (modelsWithPricing.length === 0) {
      console.log('   (ninguno)');
    } else {
      modelsWithPricing
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([modelo, stats]) => {
          const matchInfo = stats.matchType === 'exact' ? '(exacto)' : '(prefijo)';
          const pricing = MODEL_PRICING[modelo] || 
            MODEL_PRICING[Object.keys(MODEL_PRICING).find(key =>
              modelo.toLowerCase().startsWith(key.toLowerCase())
            )!];
          
          console.log(`   ✓ ${modelo} ${matchInfo}`);
          console.log(`     - Registros: ${stats.count}`);
          console.log(`     - Precio: $${pricing[0]} in / $${pricing[1]} out (por millón)`);
          
          // Mostrar datos de ejemplo
          const sample = stats.sampleRecord;
          if (sample.usage) {
            const inputTokens = sample.usage.input_tokens || 0;
            const outputTokens = sample.usage.output_tokens || 0;
            const inputCost = (inputTokens / 1_000_000) * pricing[0];
            const outputCost = (outputTokens / 1_000_000) * pricing[1];
            const totalCost = inputCost + outputCost;
            
            console.log(`     - Ejemplo: ${inputTokens} in + ${outputTokens} out = $${totalCost.toFixed(6)}`);
          }
          console.log();
        });
    }

    // Mostrar modelos SIN precio (PROBLEMA)
    console.log('\n❌ MODELOS SIN PRECIO DEFINIDO (NO CALCULAN COSTO):');
    console.log('-'.repeat(80));
    if (modelsWithoutPricing.length === 0) {
      console.log('   ✓ ¡Todos los modelos tienen precio definido!');
    } else {
      modelsWithoutPricing
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([modelo, stats]) => {
          console.log(`   ✗ ${modelo}`);
          console.log(`     - Registros afectados: ${stats.count}`);
          console.log(`     - Muestra de registro:`);
          
          const sample = stats.sampleRecord;
          console.log(`       • ID: ${sample.id}`);
          console.log(`       • Candidato: ${sample.nombre || sample.nombre_candidato || 'N/A'}`);
          console.log(`       • Timestamp: ${sample.timestamp}`);
          
          if (sample.usage) {
            console.log(`       • Tokens: ${sample.usage.input_tokens || 0} in, ${sample.usage.output_tokens || 0} out`);
          } else {
            console.log(`       • Tokens: NO DISPONIBLE (sin estructura usage)`);
          }
          console.log();
        });

      // Resumen y sugerencias
      console.log('\n📝 ACCIÓN REQUERIDA:');
      console.log('-'.repeat(80));
      console.log(`   Agregar los siguientes modelos a MODEL_PRICING en lib/openai-pricing.ts:\n`);
      
      modelsWithoutPricing.forEach(([modelo]) => {
        console.log(`   '${modelo}': [input_price, output_price],  // TODO: Consultar precio en https://openai.com/api/pricing/`);
      });
      
      const totalAffected = modelsWithoutPricing.reduce((sum, [, stats]) => sum + stats.count, 0);
      console.log(`\n   Total de registros afectados: ${totalAffected} de ${items.length}`);
      console.log(`   Porcentaje afectado: ${((totalAffected / items.length) * 100).toFixed(1)}%`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('FIN DEL ANÁLISIS');
    console.log('═'.repeat(80) + '\n');

  } catch (error: any) {
    console.error('❌ Error al consultar DynamoDB:', error.message);
    if (error.code === 'ResourceNotFoundException') {
      console.error(`   La tabla "${tableName}" no existe`);
    }
    process.exit(1);
  }
}

// Ejecutar
checkModels().catch(console.error);

