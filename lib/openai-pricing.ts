import { CostCalculation } from '@/types/openai-usage';

/**
 * ⚠️ IMPORTANTE: ACTUALIZACIÓN MANUAL DE PRECIOS
 * 
 * OpenAI NO proporciona una API para consultar precios automáticamente.
 * Los precios deben actualizarse manualmente desde la página oficial.
 * 
 * 📅 ÚLTIMA ACTUALIZACIÓN: 15 Noviembre 2024
 * 🔗 FUENTE OFICIAL: https://openai.com/api/pricing/
 * 👤 ACTUALIZADO POR: Sistema inicial
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

// Precios de OpenAI por millón de tokens
// Formato: [input_price_per_million, output_price_per_million]
const MODEL_PRICING: Record<string, [number, number]> = {
  // GPT-4o models (más recientes y económicos)
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
  
  // GPT-4.1 (modelo más reciente)
  'gpt-4.1': [3.0, 12.0],
  'gpt-4.1-2025-04-14': [3.0, 12.0],
  
  // GPT-4 legacy models
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
  
  // O1 models (reasoning models)
  'o1-preview': [15.0, 60.0],
  'o1-preview-2024-09-12': [15.0, 60.0],
  'o1-mini': [3.0, 12.0],
  'o1-mini-2024-09-12': [3.0, 12.0],
};

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
    console.warn('Modelo no especificado, usando precios de GPT-4 por defecto');
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
    console.warn(`Modelo no encontrado: ${modelName}, usando precios de GPT-4 por defecto`);
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
 * Formatea un costo en dólares
 */
export function formatCost(cost: number): string {
  return `$${(cost || 0).toFixed(4)}`;
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
  lastUpdate: '2024-11-15',
  source: 'https://openai.com/api/pricing/',
  updatedBy: 'Sistema inicial',
  recommendedCheckFrequency: 'monthly'
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

