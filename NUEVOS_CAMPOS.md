# 📝 Nuevos Campos: Auditoría de Prompts y Respuestas

## 🎯 Objetivo

Permitir la visualización y validación de los prompts enviados a OpenAI y sus respuestas, facilitando:
- **Auditoría de calidad**: Revisar qué se preguntó y qué se obtuvo
- **Optimización de prompts**: Identificar qué prompts generan mejores respuestas
- **Validación por tipo de búsqueda**: Evaluar efectividad según categoría

---

## 🆕 Campos Agregados

### 1. `input_promt` (opcional)
**Tipo:** `string`  
**Descripción:** Prompt completo enviado a la API de OpenAI

```typescript
input_promt?: string;
```

**Ejemplo:**
```
"Por favor proporciona información biográfica detallada de Evelyn Matthei 
basada en su perfil oficial del senado.cl. Incluye: fecha y lugar de 
nacimiento, formación académica, trayectoria profesional y cargos políticos."
```

### 2. `respuesta_busqueda` (opcional)
**Tipo:** `string`  
**Descripción:** Respuesta obtenida de OpenAI

```typescript
respuesta_busqueda?: string;
```

**Ejemplo:**
```
"Evelyn Matthei Fornet:

Nacimiento: 11 de noviembre de 1953, Santiago, Chile

Formación Académica:
- Ingeniera Comercial, Pontificia Universidad Católica de Chile
- Magíster en Economía, Georgetown University, EE.UU.
..."
```

---

## 📊 Visualización en el Dashboard

### Tabla con Expandible

Cuando un registro tiene estos campos disponibles:

```
┌───────────────────────────────────────────────────┐
│ ▶ 14/11/2025  Evelyn Matthei  gpt-4.1  ...       │
└───────────────────────────────────────────────────┘
```

Al hacer clic en la flecha `▶`:

```
┌───────────────────────────────────────────────────┐
│ ▼ 14/11/2025  Evelyn Matthei  gpt-4.1  ...       │
├───────────────────────────────────────────────────┤
│ 💬 Prompt Enviado:                                │
│ ┌─────────────────────────────────────────────┐   │
│ │ Por favor proporciona información...        │   │
│ └─────────────────────────────────────────────┘   │
│                                                   │
│ ✅ Respuesta Obtenida:                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ Evelyn Matthei Fornet:                      │   │
│ │ Nacimiento: 11 de noviembre de 1953...      │   │
│ └─────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

### Características:
- ✅ **Click para expandir/contraer**
- ✅ **Solo visible si los campos existen**
- ✅ **Formato pre-formateado** (respeta espacios y saltos de línea)
- ✅ **Dark mode compatible**
- ✅ **Scroll automático** para textos largos

---

## 🔧 Implementación Técnica

### 1. TypeScript Interface Actualizada

```typescript
// types/openai-usage.ts
export interface OpenAIUsage {
  // ... campos existentes ...
  
  // Nuevos campos
  input_promt?: string;           // Opcional
  respuesta_busqueda?: string;    // Opcional
}
```

### 2. Componente UsageTable

**Estado agregado:**
```typescript
const [expandedRow, setExpandedRow] = useState<string | null>(null);
```

**Lógica de expansión:**
```typescript
const hasDetails = record.input_promt || record.respuesta_busqueda;
const isExpanded = expandedRow === record.id;
```

**Renderizado condicional:**
- Solo muestra botón de expandir si `hasDetails === true`
- Fila expandida se muestra solo si `isExpanded && hasDetails`

---

## 📤 Formato de Datos en DynamoDB

### Registro Completo

```json
{
  "id": "abc123",
  "modelo_ai": "gpt-4.1-2025-04-14",
  "nombre_candidato": "Evelyn Matthei Fornet",
  "timestamp": "2025-11-14T10:30:00Z",
  "tipo_busqueda": "datos_personales",
  "input_promt": "Por favor proporciona...",
  "respuesta_busqueda": "Evelyn Matthei Fornet:\n\nNacimiento...",
  "usage": {
    "input_tokens": 32579,
    "output_tokens": 227,
    "total_tokens": 32806
  }
}
```

### Registro Sin Nuevos Campos (Retrocompatible)

```json
{
  "id": "xyz789",
  "modelo_ai": "gpt-4o-mini",
  "nombre_candidato": "José Antonio Kast",
  "timestamp": "2025-11-13T15:20:00Z",
  "tipo_busqueda": "trayectoria_politica",
  "usage": {
    "input_tokens": 15420,
    "output_tokens": 456,
    "total_tokens": 15876
  }
}
```

**Nota:** Los registros antiguos **seguirán funcionando** perfectamente, simplemente no mostrarán el botón de expandir.

---

## ✅ Casos de Uso

### 1. Validar Calidad de Respuestas
```
Objetivo: Verificar si la IA entendió correctamente el prompt
Acción: Expandir fila → Revisar prompt vs respuesta
Resultado: Identificar prompts que necesitan mejora
```

### 2. Optimizar por Tipo de Búsqueda
```
Objetivo: Mejorar prompts según categoría
Acción: Filtrar por tipo_busqueda → Revisar múltiples ejemplos
Resultado: Crear plantillas de prompts optimizadas
```

### 3. Auditoría de Costos
```
Objetivo: Justificar costos altos en consultas específicas
Acción: Ordenar por costo → Expandir consultas caras
Resultado: Entender qué prompts largos generan más valor
```

### 4. Control de Calidad
```
Objetivo: Detectar respuestas irrelevantes o incorrectas
Acción: Revisar respuestas expandidas de forma aleatoria
Resultado: Identificar patrones de error
```

---

## 🚀 Próximos Pasos (Futuro)

### Fase 1: Validación Manual ✅ (Implementado)
- Ver prompts y respuestas
- Auditoría manual de calidad

### Fase 2: Sistema de Valoración (Futuro)
- Botones "Útil" / "No Útil"
- Rating de 1-5 estrellas
- Comentarios de mejora

### Fase 3: Analytics Avanzados (Futuro)
- Dashboard de calidad por tipo
- Prompts más efectivos
- Sugerencias automáticas de mejora

### Fase 4: IA sobre IA (Futuro)
- Análisis automático de respuestas
- Detección de inconsistencias
- Scoring de calidad automatizado

---

## 📋 Checklist de Implementación

- ✅ Actualizar interface TypeScript
- ✅ Agregar columna expandible en tabla
- ✅ Implementar estado de expansión
- ✅ Renderizado condicional de detalles
- ✅ Actualizar datos de mock
- ✅ Mantener retrocompatibilidad
- ✅ Dark mode compatible
- ✅ Documentación completa
- ⏳ Deploy a producción
- ⏳ Actualizar sistema de captura de datos

---

## 🔗 Archivos Modificados

1. **types/openai-usage.ts** - Interface actualizada
2. **components/UsageTable.tsx** - Tabla con expandibles
3. **lib/mock-data.ts** - Datos de ejemplo actualizados
4. **NUEVOS_CAMPOS.md** - Esta documentación

---

## 💡 Tips de Uso

### Para Desarrolladores
- Los campos son **opcionales** (`?`)
- No rompe registros existentes
- Usa `pre` tags para mantener formato

### Para Usuarios
- Busca la flecha `▶` en la primera columna
- Click para expandir/contraer
- Usa Ctrl+F para buscar en prompts

### Para Analistas
- Exporta datos con nuevos campos
- Analiza prompts más efectivos
- Correlaciona costo vs calidad

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que los registros tengan los campos
2. Revisa console del browser (F12)
3. Comprueba formato JSON en DynamoDB

---

**Última actualización:** 14 de Noviembre de 2025  
**Versión:** 1.0.0

