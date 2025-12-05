export interface OpenAIUsage {
  id: string;
  modelo_ai: string;
  nombre: string;
  nombre_candidato: string;
  promt_utilizado: string;
  timestamp: string;
  tipoPolitico: string;
  tipo_busqueda: string;
  ultimoCargo: string | null;
  // Nuevos campos para auditoría y validación
  // Pueden ser string, objeto o array de objetos (se convertirán a JSON si es necesario)
  input_promt?: string | Record<string, any> | Array<any>;           
  respuesta_busqueda?: string | Record<string, any> | Array<any>;    
  usage: {
    // Estructura nueva (preferida)
    input_tokens?: number;
    input_tokens_details?: {
      cached_tokens: number;
    };
    output_tokens?: number;
    output_tokens_details?: {
      reasoning_tokens: number;
    };
    // Estructura antigua (alternativa)
    prompt_tokens?: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
      audio_tokens?: number;
    };
    completion_tokens?: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
      accepted_prediction_tokens?: number;
      rejected_prediction_tokens?: number;
    };
    // Total (presente en ambas)
    total_tokens: number;
  };
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface DashboardStats {
  totalCost: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  costByModel: Record<string, number>;
  costByCandidate: Record<string, number>;
  costBySearchType: Record<string, number>;
  dailyCosts: Array<{ date: string; cost: number }>;
  requestsByModel: Record<string, number>;
  requestsByCandidate: Record<string, number>;
  requestsBySearchType: Record<string, number>;
  requestsByDay: Record<string, number>;
}

