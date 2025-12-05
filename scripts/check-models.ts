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

/**
 * Normaliza los tokens de la estructura usage para soportar ambos formatos
 */
function normalizeTokens(usage: any): { input: number; output: number; total: number } {
  if (!usage) {
    return { input: 0, output: 0, total: 0 };
  }
  
  // Intentar con estructura nueva primero, luego antigua
  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? (inputTokens + outputTokens);
  
  return {
    input: inputTokens,
    output: outputTokens,
    total: totalTokens
  };
}

// Precios ACTUALIZADOS de OpenAI - Diciembre 2024 ✅
// ⚠️ IMPORTANTE: Mantener sincronizado con lib/openai-pricing.ts
const MODEL_PRICING: Record<string, [number, number]> = {
  // GPT-4o family - ✅ Verificado Dic 2024
  'gpt-4o': [5.0, 15.0],
  'gpt-4o-mini': [0.15, 0.60],
  'gpt-4o-2024-11-20': [5.0, 15.0],
  'gpt-4o-2024-08-06': [5.0, 15.0],
  'gpt-4o-2024-05-13': [5.0, 15.0],
  'gpt-4o-mini-2024-07-18': [0.15, 0.60],
  'chatgpt-4o-latest': [5.0, 15.0],
  
  // GPT-4.1 family - ✅ Verificado Dic 2024
  'gpt-4.1': [2.0, 8.0],
  'gpt-4.1-mini': [0.40, 1.60],
  'gpt-4.1-nano': [0.10, 0.40],
  'gpt-4.1-2025-04-14': [2.0, 8.0],
  'gpt-4.1-mini-2025-04-14': [0.40, 1.60],
  'gpt-4.1-nano-2025-04-14': [0.10, 0.40],
  
  // GPT-4 Turbo (legacy)
  'gpt-4-turbo': [10.0, 30.0],
  'gpt-4-turbo-preview': [10.0, 30.0],
  'gpt-4-turbo-2024-04-09': [10.0, 30.0],
  'gpt-4-1106-preview': [10.0, 30.0],
  'gpt-4-0125-preview': [10.0, 30.0],
  
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
  
  // O-series - ✅ Verificado Dic 2024
  'o1': [15.0, 60.0],
  'o1-preview': [15.0, 60.0],
  'o1-preview-2024-09-12': [15.0, 60.0],
  'o1-mini': [3.0, 12.0],
  'o1-mini-2024-09-12': [3.0, 12.0],
  'o3': [10.0, 40.0],
  'o3-mini': [3.0, 12.0],
  'o4-mini': [1.10, 4.40],
  
  // GPT-5 family - 🔮 Predicción
  'gpt-5': [4.0, 16.0],
  'gpt-5.1': [3.5, 14.0],
  'gpt-5.1-2025-11-13': [3.5, 14.0],
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
    // Obtener TODOS los registros con paginación
    console.log('📥 Obteniendo TODOS los registros (puede tomar un momento)...\n');
    
    const items: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    let pageCount = 0;
    
    do {
      pageCount++;
      const command = new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await docClient.send(command);
      
      if (response.Items && response.Items.length > 0) {
        items.push(...response.Items);
        console.log(`   Página ${pageCount}: +${response.Items.length} registros (total: ${items.length})`);
      }
      
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

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
      
      // Normalizar tokens (soporta ambas estructuras)
      const tokens = normalizeTokens(record.usage);
      
      // Detectar todos los tokens en 0
      if (tokens.input === 0 && tokens.output === 0 && tokens.total === 0) {
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
            const tokens = normalizeTokens(sample.usage);
            const inputCost = (tokens.input / 1_000_000) * pricing[0];
            const outputCost = (tokens.output / 1_000_000) * pricing[1];
            const totalCost = inputCost + outputCost;
            
            console.log(`     - Ejemplo: ${tokens.input} in + ${tokens.output} out = $${totalCost.toFixed(6)}`);
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
            const tokens = normalizeTokens(sample.usage);
            console.log(`       • Tokens: ${tokens.input} in, ${tokens.output} out`);
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

    // Calcular estadísticas de costos
    console.log('\n' + '═'.repeat(80));
    console.log('ANÁLISIS DE COSTOS');
    console.log('═'.repeat(80));
    
    let totalCostCalculated = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalRecordsWithCost = 0;
    let recordsCantCalculate = 0;
    const recordsWithIssues: any[] = [];
    
    items.forEach(record => {
      // Validar que el registro pueda calcular costo
      const modelo = record.modelo_ai;
      const hasUsage = !!record.usage;
      
      if (!modelo || !hasUsage) {
        recordsCantCalculate++;
        recordsWithIssues.push({
          id: record.id,
          problema: !modelo ? 'Sin modelo' : 'Sin usage',
          modelo: modelo || 'N/A',
          candidato: record.nombre || record.nombre_candidato || 'N/A',
          timestamp: record.timestamp || 'N/A'
        });
        return;
      }
      
      // Normalizar tokens (soporta ambas estructuras)
      const tokens = normalizeTokens(record.usage);
      const inputTokens = tokens.input;
      const outputTokens = tokens.output;
      
      // Buscar precio del modelo
      let pricing: [number, number] | undefined = MODEL_PRICING[modelo];
      if (!pricing) {
        const modelKey = Object.keys(MODEL_PRICING).find(key => 
          modelo.toLowerCase().startsWith(key.toLowerCase())
        );
        pricing = modelKey ? MODEL_PRICING[modelKey] : undefined;
      }
      
      if (!pricing) {
        recordsCantCalculate++;
        recordsWithIssues.push({
          id: record.id,
          problema: 'Modelo sin precio',
          modelo: modelo,
          candidato: record.nombre || record.nombre_candidato || 'N/A',
          timestamp: record.timestamp || 'N/A',
          tokens: `${inputTokens} in + ${outputTokens} out`
        });
        return;
      }
      
      // Calcular costo
      const [inputPrice, outputPrice] = pricing;
      const inputCost = (inputTokens / 1_000_000) * inputPrice;
      const outputCost = (outputTokens / 1_000_000) * outputPrice;
      const totalCost = inputCost + outputCost;
      
      totalCostCalculated += totalCost;
      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalRecordsWithCost++;
    });
    
    console.log(`\n📊 Estadísticas generales:`);
    console.log(`   Total registros: ${items.length}`);
    console.log(`   Registros con costo calculado: ${totalRecordsWithCost}`);
    console.log(`   Registros que NO pueden calcular: ${recordsCantCalculate}`);
    console.log(`   Porcentaje calculable: ${((totalRecordsWithCost / items.length) * 100).toFixed(2)}%`);
    
    if (totalRecordsWithCost > 0) {
      console.log(`\n💰 Totales calculados:`);
      console.log(`   Costo total: $${totalCostCalculated.toFixed(4)}`);
      console.log(`   Tokens entrada: ${totalInputTokens.toLocaleString()}`);
      console.log(`   Tokens salida: ${totalOutputTokens.toLocaleString()}`);
      console.log(`   Tokens totales: ${(totalInputTokens + totalOutputTokens).toLocaleString()}`);
      console.log(`   Costo promedio por consulta: $${(totalCostCalculated / totalRecordsWithCost).toFixed(6)}`);
    }
    
    if (recordsWithIssues.length > 0) {
      console.log(`\n⚠️ REGISTROS QUE NO PUEDEN CALCULAR COSTO (primeros 20):`);
      console.log('-'.repeat(80));
      recordsWithIssues.slice(0, 20).forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.problema}`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Modelo: ${record.modelo}`);
        console.log(`   Candidato: ${record.candidato}`);
        console.log(`   Timestamp: ${record.timestamp}`);
        if (record.tokens) {
          console.log(`   Tokens: ${record.tokens}`);
        }
      });
      
      console.log(`\n📝 Total de registros con problemas: ${recordsWithIssues.length}`);
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

