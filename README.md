# Dashboard de Costos OpenAI

Panel de estadísticas interactivo para visualizar y analizar los costos de uso de la API de OpenAI, con datos almacenados en DynamoDB.

## 🌟 Características

- **Visualización en tiempo real** de costos y uso de tokens
- **Gráficos interactivos**:
  - Costos diarios (línea temporal)
  - Costos por modelo de IA (gráfico de barras)
  - Distribución por candidato (gráfico circular)
  - Análisis por tipo de búsqueda
- **Tabla detallada** con filtrado, ordenación y paginación
- **Cálculo automático de costos** basado en las tarifas oficiales de OpenAI
- **Diseño responsive** con modo oscuro
- **Conexión directa a DynamoDB** vía AWS SDK

## 📊 Datos Soportados

El dashboard espera objetos con el siguiente formato en DynamoDB:

```json
{
  "id": "36a7bd758d7c4d9e8c3af551110cc59d",
  "modelo_ai": "gpt-4.1-2025-04-14",
  "nombre": "evelyn matthei",
  "nombre_candidato": "Evelyn Matthei Fornet",
  "promt_utilizado": "Evelyn Matthei Fornet biografía sitio oficial senado.cl",
  "timestamp": "2025-11-13T14:33:36.370698Z",
  "tipoPolitico": "Candidato Presidencial",
  "tipo_busqueda": "datos_personales",
  "ultimoCargo": null,
  "usage": {
    "input_tokens": 32579,
    "input_tokens_details": {
      "cached_tokens": 0
    },
    "output_tokens": 227,
    "output_tokens_details": {
      "reasoning_tokens": 0
    },
    "total_tokens": 32806
  }
}
```

## 🚀 Inicio Rápido

### Opción 1: Modo Demo (sin DynamoDB)

¡Prueba la aplicación sin configuración!

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo demo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

La aplicación usará datos de ejemplo automáticamente. Verás un indicador "MODO DEMO" en el header.

### Opción 2: Conexión a DynamoDB

Para usar tus datos reales de DynamoDB:

#### 1. Instalar dependencias

```bash
npm install
```

#### 2. Configurar variables de entorno

Edita el archivo `.env.local` y agrega tus credenciales de AWS:

```env
# Desactivar modo demo
DEMO_MODE=false

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
DYNAMODB_TABLE_NAME=nombre_de_tu_tabla
```

#### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Build para producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   └── usage/
│   │       └── route.ts          # API endpoint para obtener datos
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página principal del dashboard
├── components/
│   ├── StatCard.tsx              # Tarjeta de estadística
│   ├── CostByModelChart.tsx      # Gráfico de costos por modelo
│   ├── DailyCostChart.tsx        # Gráfico de costos diarios
│   ├── CostByCandidateChart.tsx  # Gráfico de costos por candidato
│   └── UsageTable.tsx            # Tabla de historial
├── lib/
│   ├── dynamodb.ts               # Cliente de DynamoDB
│   ├── openai-pricing.ts         # Cálculo de precios
│   └── stats.ts                  # Cálculo de estadísticas
├── types/
│   └── openai-usage.ts           # Tipos TypeScript
└── package.json
```

## 💰 Modelos Soportados y Precios

El dashboard incluye precios actualizados para los siguientes modelos:

### GPT-4
- GPT-4: $30/$60 por millón de tokens (input/output)
- GPT-4 Turbo: $10/$30 por millón de tokens
- GPT-4o: $5/$15 por millón de tokens
- GPT-4o-mini: $0.15/$0.60 por millón de tokens

### GPT-3.5
- GPT-3.5 Turbo: $0.50/$1.50 por millón de tokens

### O1
- O1-preview: $15/$60 por millón de tokens
- O1-mini: $3/$12 por millón de tokens

## 🔧 Tecnologías Utilizadas

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos y diseño responsive
- **Recharts** - Gráficos interactivos
- **AWS SDK** - Conexión con DynamoDB
- **date-fns** - Manejo de fechas

## 📝 Notas Importantes

1. **Permisos AWS**: Asegúrate de que tu usuario IAM tenga permisos de lectura (`dynamodb:Scan`) en la tabla de DynamoDB.

2. **Seguridad**: Las credenciales de AWS se manejan del lado del servidor (API route), nunca se exponen al cliente.

3. **Caché**: La aplicación no implementa caché por defecto. Para grandes volúmenes de datos, considera implementar:
   - Caché en el servidor (Redis, memoria)
   - Paginación en DynamoDB
   - Actualización incremental

4. **Costos**: Los precios de OpenAI pueden cambiar. Actualiza el archivo `lib/openai-pricing.ts` según sea necesario.

## 🤝 Contribuciones

Si encuentras algún error o quieres añadir nuevas funcionalidades, siéntete libre de hacer un pull request.

## 📄 Licencia

MIT

