import { CostCalculation } from '@/types/openai-usage';

// Precios de OpenAI por millón de tokens (actualizados Noviembre 2024)
// Formato: [input_price_per_million, output_price_per_million]
// Fuente: https://openai.com/api/pricing/
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
  const inputCost = (inputTokens / 1_000_000) * inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * outputPricePerMillion;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
  };
}

/**
 * Formatea un costo en dólares
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Obtiene información de precios para un modelo
 */
export function getModelPricing(modelName: string): { input: number; output: number } | null {
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

