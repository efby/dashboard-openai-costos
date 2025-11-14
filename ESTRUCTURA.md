# 📁 Estructura del Proyecto

## 🎯 Vista General

Este proyecto es un Dashboard completo de Next.js 14 con TypeScript para visualizar costos de OpenAI.

```
panel de estadistica/
│
├── 📱 app/                          # Aplicación Next.js (App Router)
│   ├── api/
│   │   └── usage/
│   │       └── route.ts             # API: Obtener datos de DynamoDB
│   ├── globals.css                  # Estilos globales + Tailwind
│   ├── layout.tsx                   # Layout principal de la app
│   └── page.tsx                     # ⭐ Página principal del dashboard
│
├── 🎨 components/                   # Componentes React reutilizables
│   ├── StatCard.tsx                 # Tarjetas de estadísticas
│   ├── CostByModelChart.tsx         # Gráfico: Costos por modelo (barras)
│   ├── DailyCostChart.tsx           # Gráfico: Costos diarios (línea)
│   ├── CostByCandidateChart.tsx     # Gráfico: Costos por candidato (pie)
│   └── UsageTable.tsx               # Tabla detallada con filtros
│
├── 🔧 lib/                          # Lógica de negocio y utilidades
│   ├── dynamodb.ts                  # Cliente AWS DynamoDB
│   ├── mock-data.ts                 # Datos de ejemplo (modo demo)
│   ├── openai-pricing.ts            # Cálculo de precios por modelo
│   └── stats.ts                     # Cálculo de estadísticas
│
├── 📘 types/                        # Definiciones TypeScript
│   └── openai-usage.ts              # Interfaces y tipos
│
├── 📄 Configuración
│   ├── package.json                 # Dependencias y scripts
│   ├── tsconfig.json                # Configuración TypeScript
│   ├── tailwind.config.ts           # Configuración Tailwind CSS
│   ├── next.config.js               # Configuración Next.js
│   ├── postcss.config.js            # PostCSS para Tailwind
│   ├── .eslintrc.json               # ESLint
│   ├── .gitignore                   # Archivos ignorados por Git
│   └── next-env.d.ts                # Tipos Next.js
│
└── 📖 Documentación
    ├── README.md                    # Documentación principal
    ├── QUICKSTART.md                # ⚡ Guía de inicio rápido
    ├── SETUP.md                     # Configuración detallada
    └── ESTRUCTURA.md                # Este archivo
```

---

## 🧩 Flujo de Datos

```
┌─────────────────┐
│  Navegador      │
│  (Usuario)      │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────────────────────────┐
│  app/page.tsx                       │
│  - Estado y UI del dashboard        │
│  - Fetch datos de la API            │
└────────┬────────────────────────────┘
         │ fetch('/api/usage')
         ▼
┌─────────────────────────────────────┐
│  app/api/usage/route.ts             │
│  ├─ ¿Modo Demo?                     │
│  │  ├─ Sí → mock-data.ts            │
│  │  └─ No → dynamodb.ts             │
│  └─ stats.ts (calcular estadísticas)│
└────────┬────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
         ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ DynamoDB     │ │ Mock Data│ │ openai-pricing│
│ (AWS)        │ │          │ │ (cálculos)    │
└──────────────┘ └──────────┘ └──────────────┘
```

---

## 📊 Componentes del Dashboard

### 1. **Tarjetas de Estadísticas** (`StatCard.tsx`)
Muestra métricas clave:
- Costo Total
- Total Consultas
- Tokens Totales
- Costo Promedio

### 2. **Gráfico de Costos Diarios** (`DailyCostChart.tsx`)
- Tipo: Línea temporal
- Muestra: Evolución del gasto por día
- Librería: Recharts

### 3. **Gráfico de Costos por Modelo** (`CostByModelChart.tsx`)
- Tipo: Barras
- Muestra: Comparación de costos entre modelos (GPT-4, GPT-3.5, etc.)
- Librería: Recharts

### 4. **Gráfico de Costos por Candidato** (`CostByCandidateChart.tsx`)
- Tipo: Circular (Pie Chart)
- Muestra: Top 10 candidatos más consultados
- Librería: Recharts

### 5. **Tabla de Historial** (`UsageTable.tsx`)
- Muestra todos los registros detallados
- Funciones:
  - Filtrado por modelo
  - Ordenación por fecha o costo
  - Paginación (10 items por página)
  - Búsqueda visual de datos

---

## 🔌 Conexión con DynamoDB

### Archivo: `lib/dynamodb.ts`

```typescript
// Flujo de conexión
1. Inicializar cliente DynamoDB con credenciales
2. Ejecutar Scan en la tabla configurada
3. Retornar array de objetos OpenAIUsage
```

### Variables de entorno requeridas:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
DYNAMODB_TABLE_NAME=xxx
```

---

## 💰 Cálculo de Costos

### Archivo: `lib/openai-pricing.ts`

**Modelos soportados:**
- GPT-4 y variantes
- GPT-3.5 Turbo
- GPT-4o y GPT-4o-mini
- O1-preview y O1-mini

**Fórmula:**
```
Costo = (input_tokens / 1,000,000) × precio_input +
        (output_tokens / 1,000,000) × precio_output
```

**Precios por millón de tokens:**
| Modelo | Input | Output |
|--------|-------|--------|
| GPT-4 | $30 | $60 |
| GPT-4 Turbo | $10 | $30 |
| GPT-4o | $5 | $15 |
| GPT-4o-mini | $0.15 | $0.60 |
| GPT-3.5 | $0.50 | $1.50 |

---

## 🎭 Modo Demo

El dashboard incluye un **modo demo** que permite probar la aplicación sin configurar DynamoDB.

### Activación:
```env
DEMO_MODE=true
# o simplemente no configurar DYNAMODB_TABLE_NAME
```

### Datos de ejemplo:
- 10 registros de consultas ficticias
- Múltiples modelos (GPT-4, GPT-3.5, GPT-4o)
- Varios candidatos políticos chilenos
- Diferentes tipos de búsqueda

Archivo: `lib/mock-data.ts`

---

## 🎨 Diseño y Estilos

### Tecnología: Tailwind CSS

**Características:**
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Modo oscuro automático (basado en preferencias del sistema)
- ✅ Animaciones y transiciones suaves
- ✅ Componentes modernos y profesionales

**Colores principales:**
- Azul: Estadísticas y elementos primarios
- Verde: Gráficos de tendencias positivas
- Naranja/Amarillo: Alertas y modo demo
- Morado: Tokens y elementos secundarios

---

## 🔐 Seguridad

### Buenas prácticas implementadas:

1. **Variables de entorno**
   - Credenciales nunca expuestas al cliente
   - Procesamiento en servidor (API Routes)

2. **Permisos mínimos**
   - Solo lectura en DynamoDB
   - No requiere permisos de escritura

3. **Gitignore**
   - `.env.local` excluido del repositorio
   - Credenciales nunca versionadas

---

## 📦 Dependencias Principales

```json
{
  "next": "14.2.10",              // Framework React
  "react": "18.3.1",              // Librería UI
  "typescript": "5.5.3",          // Tipado estático
  "tailwindcss": "3.4.4",         // Estilos
  "recharts": "2.12.7",           // Gráficos
  "@aws-sdk/client-dynamodb": "3.658.1",  // AWS DynamoDB
  "date-fns": "3.6.0"             // Manejo de fechas
}
```

---

## 🚀 Scripts Disponibles

```bash
npm run dev      # Desarrollo (hot reload)
npm run build    # Compilar para producción
npm start        # Ejecutar versión de producción
npm run lint     # Verificar código
```

---

## 📈 Métricas Calculadas

El archivo `lib/stats.ts` calcula:

1. **Totales:**
   - Costo total acumulado
   - Total de consultas
   - Tokens totales (input + output)

2. **Agrupaciones:**
   - Costo por modelo
   - Costo por candidato
   - Costo por tipo de búsqueda
   - Costos diarios

3. **Promedios:**
   - Costo promedio por consulta
   - Tokens promedio por consulta

---

## 🔄 Extensibilidad

### Agregar nuevos gráficos:
1. Crear componente en `components/`
2. Usar Recharts para la visualización
3. Importar en `app/page.tsx`

### Agregar nuevos modelos:
1. Editar `lib/openai-pricing.ts`
2. Agregar entrada en `MODEL_PRICING`

### Modificar estilos:
1. Colores: `tailwind.config.ts`
2. Estilos globales: `app/globals.css`

---

## 🎯 Próximas Funcionalidades Sugeridas

- [ ] Exportar datos a CSV/Excel
- [ ] Filtros por rango de fechas
- [ ] Comparación entre períodos
- [ ] Alertas de costos altos
- [ ] Proyecciones de gastos
- [ ] Integración con múltiples tablas DynamoDB
- [ ] Autenticación de usuarios
- [ ] Dashboard multi-tenant

---

**Autor**: Dashboard de Costos OpenAI  
**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025

