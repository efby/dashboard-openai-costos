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
  usage: {
    input_tokens: number;
    input_tokens_details: {
      cached_tokens: number;
    };
    output_tokens: number;
    output_tokens_details: {
      reasoning_tokens: number;
    };
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

