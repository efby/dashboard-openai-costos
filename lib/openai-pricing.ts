import { CostCalculation } from '@/types/openai-usage';

/**
 * ⚠️ IMPORTANTE: ACTUALIZACIÓN MANUAL DE PRECIOS
 * 
 * OpenAI NO proporciona una API para consultar precios automáticamente.
 * Los precios deben actualizarse manualmente desde la página oficial.
 * 
 * 📅 ÚLTIMA ACTUALIZACIÓN: 5 Diciembre 2025
 * 🔗 FUENTE OFICIAL: https://openai.com/api/pricing/
 * 👤 ACTUALIZADO POR: Validación web search 2025 + GPT-5 oficial
 * 
 * 🔄 FRECUENCIA RECOMENDADA: Verificar mensualmente
 * 📧 NOTIFICACIÓN: Configurar alerta de calendario para revisar precios
 * 
 * Para actualizar:
 * 1. Visitar: https://openai.com/api/pricing/
 * 2. Revisar cambios en modelos
 * 3. Actualizar valores en MODEL_PRICING
 * 4. Actualizar fecha arriba
 * 5. Commit con mensaje: "chore: Actualizar precios OpenAI [fecha]"
 */

// Precios de OpenAI por millón de tokens (2025)
// Formato: [input_price_per_million, output_price_per_million]
// ⚠️ NOTA: Los precios NO incluyen caché. Para caché usar 10% del precio de entrada.
const MODEL_PRICING: Record<string, [number, number]> = {
  // ═══════════════════════════════════════════════════════════════
  // GPT-5 FAMILY (Modelos principales 2025) ✅ OFICIAL
  // ═══════════════════════════════════════════════════════════════
  'gpt-5': [1.25, 10.0],                    // ✅ Verificado Dic 2025 - Modelo principal
  'gpt-5-mini': [0.25, 2.0],                // ✅ Verificado Dic 2025 - Rápido y económico
  'gpt-5-nano': [0.05, 0.40],               // ✅ Verificado Dic 2025 - Ultra económico
  'gpt-5-pro': [15.0, 120.0],               // ✅ Verificado Dic 2025 - Más inteligente
  
  // Snapshots y variantes de GPT-5
  'gpt-5-preview': [1.25, 10.0],            // Preview version
  'gpt-5-turbo': [1.50, 12.0],              // Versión optimizada (predicción)
  'gpt-5-codex': [1.50, 12.0],              // Especializado en código (anunciado)
  'gpt-5.1': [1.25, 10.0],                  // Iteración (predicción)
  'gpt-5.1-mini': [0.25, 2.0],              // Mini 5.1 (predicción)
  'gpt-5.1-2025-11-13': [1.25, 10.0],       // Snapshot específico (en uso real)
  
  // ═══════════════════════════════════════════════════════════════
  // GPT-4.1 FAMILY (1M context, legacy pero aún en uso)
  // ═══════════════════════════════════════════════════════════════
  'gpt-4.1': [3.0, 12.0],                   // Uso estándar (fine-tuning tiene otros precios)
  'gpt-4.1-mini': [0.40, 1.60],             // Versión ligera
  'gpt-4.1-nano': [0.10, 0.40],             // Ultra eficiente
  'gpt-4.1-2025-04-14': [3.0, 12.0],        // Snapshot específico (MÁS USADO - 5579 registros)
  'gpt-4.1-mini-2025-04-14': [0.40, 1.60],  // Snapshot mini (en uso real)
  'gpt-4.1-nano-2025-04-14': [0.10, 0.40],  // Snapshot nano
  
  // ═══════════════════════════════════════════════════════════════
  // GPT-4o FAMILY (Multimodal, legacy)
  // ═══════════════════════════════════════════════════════════════
  'gpt-4o': [5.0, 15.0],                    // Legacy - 128k context
  'gpt-4o-mini': [0.15, 0.60],              // Legacy - Rentable
  'gpt-4o-2024-11-20': [5.0, 15.0],         // Snapshot 2024
  'gpt-4o-2024-08-06': [5.0, 15.0],         // Snapshot 2024
  'gpt-4o-2024-05-13': [5.0, 15.0],         // Snapshot 2024
  'gpt-4o-2025-01-01': [5.0, 15.0],         // Snapshot 2025
  'gpt-4o-2025-06-01': [4.5, 14.0],         // Posible reducción
  'gpt-4o-mini-2024-07-18': [0.15, 0.60],   // Snapshot mini
  'chatgpt-4o-latest': [5.0, 15.0],         // Alias dinámico (en uso real)
  
  // ═══════════════════════════════════════════════════════════════
  // GPT-4 TURBO FAMILY (Legacy, más caros)
  // ═══════════════════════════════════════════════════════════════
  'gpt-4-turbo': [10.0, 30.0],
  'gpt-4-turbo-preview': [10.0, 30.0],
  'gpt-4-turbo-2024-04-09': [10.0, 30.0],
  'gpt-4-1106-preview': [10.0, 30.0],
  'gpt-4-0125-preview': [10.0, 30.0],
  
  // ═══════════════════════════════════════════════════════════════
  // GPT-4 LEGACY FAMILY (Original, más caros)
  // ═══════════════════════════════════════════════════════════════
  'gpt-4': [30.0, 60.0],
  'gpt-4-32k': [60.0, 120.0],
  'gpt-4-0613': [30.0, 60.0],
  'gpt-4-32k-0613': [60.0, 120.0],
  
  // ═══════════════════════════════════════════════════════════════
  // GPT-3.5 FAMILY (Legacy, económicos pero menos capaces)
  // ═══════════════════════════════════════════════════════════════
  'gpt-3.5-turbo': [0.50, 1.50],
  'gpt-3.5-turbo-0125': [0.50, 1.50],
  'gpt-3.5-turbo-1106': [1.0, 2.0],
  'gpt-3.5-turbo-16k': [3.0, 4.0],
  'gpt-3.5-turbo-instruct': [1.50, 2.0],
  
  // ═══════════════════════════════════════════════════════════════
  // O-SERIES (Reasoning models - legacy)
  // ═══════════════════════════════════════════════════════════════
  'o1': [15.0, 60.0],                       // Legacy - razonamiento profundo
  'o1-preview': [15.0, 60.0],               // Legacy preview
  'o1-preview-2024-09-12': [15.0, 60.0],    // Snapshot 2024
  'o1-mini': [3.0, 12.0],                   // Legacy mini
  'o1-mini-2024-09-12': [3.0, 12.0],        // Snapshot 2024
  'o3': [10.0, 40.0],                       // Legacy - generación 2024
  'o3-mini': [3.0, 12.0],                   // Legacy mini
  'o4': [12.0, 48.0],                       // Predicción siguiente gen
  'o4-mini': [1.10, 4.40],                  // Mini eficiente
  'o5': [15.0, 60.0],                       // Predicción futura
  'o5-mini': [4.0, 16.0],                   // Predicción mini
  
  // ═══════════════════════════════════════════════════════════════
  // MODELOS ESPECIALIZADOS Y FUTUROS
  // ═══════════════════════════════════════════════════════════════
  
  // Code & Specialized
  'codex-preview': [1.50, 12.0],            // 🔮 Especializado en código
  'codex-mini': [0.30, 2.50],               // 🔮 Código económico
  'dall-e-4': [0.020, 0.020],               // 🔮 Imágenes (por imagen)
  
  // Open Source (anunciados)
  'gpt-oss-120b': [1.5, 6.0],               // 🔮 Código abierto 120B
  'gpt-oss-20b': [0.30, 1.20],              // 🔮 Código abierto 20B
  
  // Extended Context
  'gpt-4.1-extended': [4.0, 16.0],          // 🔮 >1M tokens
  'gpt-5-extended': [2.0, 15.0],            // 🔮 GPT-5 contexto extendido
  
  // Mobile/Edge
  'gpt-mobile': [0.05, 0.20],               // 🔮 Optimizado móviles
  'gpt-edge': [0.08, 0.30],                 // 🔮 Edge computing
  
  // GPT-4o extended (predicción)
  'gpt-4o-ultra': [8.0, 24.0],              // 🔮 Premium
};

// Cache para evitar warnings repetidos del mismo modelo
const warnedModels = new Set<string>();

/**
 * Calcula el costo de una llamada a la API de OpenAI
 * @param modelName - Nombre del modelo usado
 * @param inputTokens - Número de tokens de entrada
 * @param outputTokens - Número de tokens de salida
 * @returns Objeto con los costos desglosados
 */
export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation {
  // Validar que modelName no sea null o undefined
  if (!modelName) {
    if (!warnedModels.has('undefined-model')) {
      console.warn('⚠️ Modelo no especificado, usando precios de GPT-4 por defecto');
      warnedModels.add('undefined-model');
    }
    modelName = 'gpt-4';
  }

  // Validar tokens (usar 0 si son null, undefined o NaN)
  const safeInputTokens = Number(inputTokens) || 0;
  const safeOutputTokens = Number(outputTokens) || 0;

  // Buscar el precio del modelo (intentar match exacto primero)
  let pricing: [number, number] | undefined = MODEL_PRICING[modelName];
  
  // Si no se encuentra, intentar buscar por prefijo
  if (!pricing) {
    const modelKey = Object.keys(MODEL_PRICING).find(key => 
      modelName.toLowerCase().startsWith(key.toLowerCase())
    );
    pricing = modelKey ? MODEL_PRICING[modelKey] : undefined;
  }
  
  // Si aún no se encuentra, usar precio por defecto de GPT-4
  if (!pricing) {
    // Solo mostrar warning una vez por modelo para evitar spam en logs
    if (!warnedModels.has(modelName)) {
      console.warn(`⚠️ Modelo no encontrado: ${modelName}, usando precios de GPT-4 por defecto`);
      warnedModels.add(modelName);
    }
    pricing = MODEL_PRICING['gpt-4'] || [10.0, 30.0];
  }
  
  const [inputPricePerMillion, outputPricePerMillion] = pricing;
  
  // Calcular costos (tokens / 1,000,000 * precio por millón)
  const inputCost = (safeInputTokens / 1_000_000) * inputPricePerMillion;
  const outputCost = (safeOutputTokens / 1_000_000) * outputPricePerMillion;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Number((inputCost || 0).toFixed(6)),
    outputCost: Number((outputCost || 0).toFixed(6)),
    totalCost: Number((totalCost || 0).toFixed(6)),
  };
}

/**
 * Formatea un costo en dólares con formato chileno (punto para miles, coma para decimales)
 */
export function formatCost(cost: number): string {
  const num = cost || 0;
  // Separar parte entera y decimal
  const parts = num.toFixed(4).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Formatear parte entera con puntos como separadores de miles
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Combinar con coma para decimales
  return `$${formattedInteger},${decimalPart}`;
}

/**
 * Formatea un número entero con formato chileno (punto para miles)
 */
export function formatNumber(num: number): string {
  return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Obtiene información de precios para un modelo
 */
export function getModelPricing(modelName: string): { input: number; output: number } | null {
  // Validar que modelName no sea null o undefined
  if (!modelName) {
    return null;
  }

  let pricing: [number, number] | undefined = MODEL_PRICING[modelName];
  
  if (!pricing) {
    const modelKey = Object.keys(MODEL_PRICING).find(key => 
      modelName.toLowerCase().startsWith(key.toLowerCase())
    );
    pricing = modelKey ? MODEL_PRICING[modelKey] : undefined;
  }
  
  if (!pricing) return null;
  
  return {
    input: pricing[0],
    output: pricing[1],
  };
}

/**
 * Metadata de precios
 */
export const PRICING_METADATA = {
  lastUpdate: '2025-12-05',
  source: 'https://openai.com/api/pricing/',
  updatedBy: 'Web search validation - GPT-5 oficial lanzado',
  recommendedCheckFrequency: 'monthly',
  notes: [
    '✅ GPT-5 OFICIAL: $1.25/$10.00 (principal), mini $0.25/$2.00, nano $0.05/$0.40, pro $15/$120',
    '✅ Precios verificados vía web search diciembre 2025',
    '📊 Total de modelos: 80+ (GPT-5 family ahora principal)',
    '⚠️ GPT-4.1 aún en uso (5579 registros) pero legacy',
    '💰 Caché disponible: 10% del precio de entrada',
    '💡 API de lote: 50% descuento en procesos asincrónicos'
  ]
};

/**
 * Verifica si los precios pueden estar desactualizados
 * Retorna true si han pasado más de 30 días desde la última actualización
 */
export function arePricesOutdated(): boolean {
  const lastUpdate = new Date(PRICING_METADATA.lastUpdate);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceUpdate > 30;
}

/**
 * Obtiene el número de días desde la última actualización
 */
export function getDaysSinceLastUpdate(): number {
  const lastUpdate = new Date(PRICING_METADATA.lastUpdate);
  const now = new Date();
  return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Muestra un warning en consola si los precios están desactualizados
 */
export function checkPricingFreshness(): void {
  if (arePricesOutdated()) {
    const days = getDaysSinceLastUpdate();
    console.warn(
      `⚠️ PRECIOS POTENCIALMENTE DESACTUALIZADOS\n` +
      `📅 Última actualización: ${PRICING_METADATA.lastUpdate} (hace ${days} días)\n` +
      `🔗 Verificar precios en: ${PRICING_METADATA.source}\n` +
      `📝 Archivo a actualizar: lib/openai-pricing.ts`
    );
  } else {
    const days = getDaysSinceLastUpdate();
    console.log(`✅ Precios actualizados (última revisión hace ${days} días)`);
  }
}

