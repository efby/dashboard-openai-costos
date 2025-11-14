import { OpenAIUsage } from '@/types/openai-usage';

/**
 * Datos de ejemplo para testing sin conexión a DynamoDB
 * Útil para desarrollo y pruebas
 */
export const mockUsageData: OpenAIUsage[] = [
  {
    id: "1a2b3c4d5e6f",
    modelo_ai: "gpt-4.1-2025-04-14",
    nombre: "evelyn matthei",
    nombre_candidato: "Evelyn Matthei Fornet",
    promt_utilizado: "Evelyn Matthei Fornet biografía sitio oficial senado.cl",
    timestamp: "2025-11-13T14:33:36.370698Z",
    tipoPolitico: "Candidato Presidencial",
    tipo_busqueda: "datos_personales",
    ultimoCargo: null,
    usage: {
      input_tokens: 32579,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 227,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 32806
    }
  },
  {
    id: "2b3c4d5e6f7g",
    modelo_ai: "gpt-4o-mini",
    nombre: "jose antonio kast",
    nombre_candidato: "José Antonio Kast Rist",
    promt_utilizado: "José Antonio Kast trayectoria política",
    timestamp: "2025-11-13T15:20:15.123456Z",
    tipoPolitico: "Candidato Presidencial",
    tipo_busqueda: "trayectoria_politica",
    ultimoCargo: "Diputado",
    usage: {
      input_tokens: 15420,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 456,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 15876
    }
  },
  {
    id: "3c4d5e6f7g8h",
    modelo_ai: "gpt-4-turbo",
    nombre: "michelle bachelet",
    nombre_candidato: "Michelle Bachelet Jeria",
    promt_utilizado: "Michelle Bachelet programas de gobierno",
    timestamp: "2025-11-12T10:15:30.789012Z",
    tipoPolitico: "Ex Presidente",
    tipo_busqueda: "programa_gobierno",
    ultimoCargo: "Presidente de la República",
    usage: {
      input_tokens: 28900,
      input_tokens_details: { cached_tokens: 5000 },
      output_tokens: 1200,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 30100
    }
  },
  {
    id: "4d5e6f7g8h9i",
    modelo_ai: "gpt-3.5-turbo",
    nombre: "gabriel boric",
    nombre_candidato: "Gabriel Boric Font",
    promt_utilizado: "Gabriel Boric propuestas económicas",
    timestamp: "2025-11-12T16:45:22.345678Z",
    tipoPolitico: "Presidente",
    tipo_busqueda: "propuestas",
    ultimoCargo: "Presidente de la República",
    usage: {
      input_tokens: 8500,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 350,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 8850
    }
  },
  {
    id: "5e6f7g8h9i0j",
    modelo_ai: "gpt-4o",
    nombre: "pamela jiles",
    nombre_candidato: "Pamela Jiles Moreno",
    promt_utilizado: "Pamela Jiles historial legislativo",
    timestamp: "2025-11-11T09:30:45.567890Z",
    tipoPolitico: "Diputada",
    tipo_busqueda: "historial_legislativo",
    ultimoCargo: "Diputada",
    usage: {
      input_tokens: 12300,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 580,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 12880
    }
  },
  {
    id: "6f7g8h9i0j1k",
    modelo_ai: "gpt-4.1-2025-04-14",
    nombre: "giorgio jackson",
    nombre_candidato: "Giorgio Jackson Drago",
    promt_utilizado: "Giorgio Jackson participación en movimientos sociales",
    timestamp: "2025-11-11T14:20:10.234567Z",
    tipoPolitico: "Ministro",
    tipo_busqueda: "movimientos_sociales",
    ultimoCargo: "Ministro de Desarrollo Social",
    usage: {
      input_tokens: 19800,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 720,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 20520
    }
  },
  {
    id: "7g8h9i0j1k2l",
    modelo_ai: "gpt-4o-mini",
    nombre: "maite orsini",
    nombre_candidato: "Maite Orsini Pascal",
    promt_utilizado: "Maite Orsini propuestas sobre derechos humanos",
    timestamp: "2025-11-10T11:55:33.890123Z",
    tipoPolitico: "Diputada",
    tipo_busqueda: "propuestas",
    ultimoCargo: "Diputada",
    usage: {
      input_tokens: 7200,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 290,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 7490
    }
  },
  {
    id: "8h9i0j1k2l3m",
    modelo_ai: "gpt-4-turbo",
    nombre: "joaquin lavin",
    nombre_candidato: "Joaquín Lavín León",
    promt_utilizado: "Joaquín Lavín gestión municipal",
    timestamp: "2025-11-10T13:40:18.456789Z",
    tipoPolitico: "Alcalde",
    tipo_busqueda: "gestion_municipal",
    ultimoCargo: "Alcalde de Las Condes",
    usage: {
      input_tokens: 22100,
      input_tokens_details: { cached_tokens: 3000 },
      output_tokens: 890,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 22990
    }
  },
  {
    id: "9i0j1k2l3m4n",
    modelo_ai: "gpt-3.5-turbo",
    nombre: "camila vallejo",
    nombre_candidato: "Camila Vallejo Dowling",
    promt_utilizado: "Camila Vallejo rol en movimiento estudiantil",
    timestamp: "2025-11-09T10:25:50.678901Z",
    tipoPolitico: "Ministra",
    tipo_busqueda: "movimientos_sociales",
    ultimoCargo: "Ministra Secretaria General de Gobierno",
    usage: {
      input_tokens: 9800,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 420,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 10220
    }
  },
  {
    id: "0j1k2l3m4n5o",
    modelo_ai: "gpt-4o",
    nombre: "carolina toha",
    nombre_candidato: "Carolina Tohá Morales",
    promt_utilizado: "Carolina Tohá políticas de seguridad",
    timestamp: "2025-11-09T15:10:25.123456Z",
    tipoPolitico: "Ministra",
    tipo_busqueda: "politicas_publicas",
    ultimoCargo: "Ministra del Interior",
    usage: {
      input_tokens: 18600,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 650,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 19250
    }
  }
];

/**
 * Verifica si la aplicación está en modo demo
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || !process.env.DYNAMODB_TABLE_NAME;
}

