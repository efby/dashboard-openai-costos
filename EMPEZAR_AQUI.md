# 🎉 ¡Bienvenido al Dashboard de Costos OpenAI!

## ⚡ Inicio Inmediato (30 segundos)

Ejecuta estos 2 comandos:

```bash
npm install
npm run dev
```

Luego abre: **http://localhost:3000**

🎊 **¡Ya está funcionando!** Verás el dashboard con datos de ejemplo.

---

## 📖 ¿Qué acabas de instalar?

Un dashboard completo y profesional para visualizar los costos de uso de OpenAI API con datos almacenados en DynamoDB.

### ✨ Características Principales:

✅ **Visualización de Costos**
- Gráfico de costos diarios
- Comparación por modelo (GPT-4, GPT-3.5, etc.)
- Distribución por candidato
- Análisis por tipo de búsqueda

✅ **Estadísticas Detalladas**
- Costo total acumulado
- Número de consultas
- Tokens consumidos
- Costo promedio por consulta

✅ **Tabla Interactiva**
- Historial completo de consultas
- Filtros por modelo
- Ordenación personalizada
- Paginación inteligente

✅ **Cálculo Automático de Precios**
- Precios actualizados de OpenAI (2025)
- Soporte para todos los modelos GPT
- Cálculo preciso por tokens

✅ **Modo Demo Incluido**
- Funciona sin configuración
- Datos de ejemplo precargados
- Ideal para testing

---

## 🗂️ Documentación Disponible

| Archivo | Descripción | ¿Cuándo leerlo? |
|---------|-------------|-----------------|
| **QUICKSTART.md** | Guía de inicio rápido | Ahora mismo |
| **SETUP.md** | Configuración detallada de AWS | Cuando conectes DynamoDB |
| **README.md** | Documentación completa | Para referencia general |
| **ESTRUCTURA.md** | Arquitectura del proyecto | Si quieres modificar el código |

---

## 🎯 Próximos Pasos

### 1️⃣ Probar el Dashboard (YA ESTÁ LISTO)

```bash
npm run dev
```

Explora todas las funciones en modo demo.

### 2️⃣ Conectar con tus Datos Reales

Cuando estés listo para ver tus datos de DynamoDB:

1. Lee `SETUP.md` para configurar AWS
2. Crea archivo `.env.local` con tus credenciales
3. Reinicia el servidor

### 3️⃣ Personalizar (Opcional)

- **Colores**: Edita `tailwind.config.ts`
- **Precios**: Actualiza `lib/openai-pricing.ts`
- **Gráficos**: Modifica componentes en `components/`

---

## 📊 Vista Previa del Dashboard

### Header
```
┌──────────────────────────────────────────────────────┐
│ Dashboard de Costos OpenAI             [Actualizar] │
│ Análisis de uso y costos de la API de OpenAI        │
└──────────────────────────────────────────────────────┘
```

### Tarjetas de Estadísticas
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Costo Total  │ │ Total        │ │ Tokens       │ │ Costo        │
│ $10.4532     │ │ Consultas    │ │ Totales      │ │ Promedio     │
│              │ │ 142          │ │ 1.2M         │ │ $0.0736      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Gráficos
```
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Costos Diarios             │ │ Costos por Modelo          │
│ [Gráfico de línea]         │ │ [Gráfico de barras]        │
│                            │ │                            │
│ Muestra evolución diaria   │ │ Compara GPT-4, GPT-3.5...  │
└─────────────────────────────┘ └─────────────────────────────┘

┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Costos por Candidato       │ │ Costos por Tipo Búsqueda   │
│ [Gráfico circular]         │ │ [Barras de progreso]       │
│                            │ │                            │
│ Top 10 más consultados     │ │ Distribución por categoría │
└─────────────────────────────┘ └─────────────────────────────┘
```

### Tabla de Historial
```
┌────────────────────────────────────────────────────────────────┐
│ Filtros: [Todos los modelos ▼] [Ordenar por fecha ▼]        │
├────────────────────────────────────────────────────────────────┤
│ Fecha         │ Candidato  │ Modelo     │ Tokens │ Costo     │
├────────────────────────────────────────────────────────────────┤
│ 13/11 14:33   │ E. Matthei │ GPT-4.1    │ 32,806 │ $0.3349   │
│ 13/11 15:20   │ J.A. Kast  │ GPT-4o-mini│ 15,876 │ $0.0026   │
│ ...           │ ...        │ ...        │ ...    │ ...       │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

- **Next.js 14**: Framework React moderno
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos profesionales
- **Recharts**: Gráficos interactivos
- **AWS SDK**: Conexión con DynamoDB
- **date-fns**: Manejo de fechas

---

## 🔐 Seguridad

✅ **Credenciales protegidas**
- Variables de entorno nunca expuestas
- Procesamiento en servidor

✅ **Permisos mínimos**
- Solo lectura en DynamoDB
- Sin acceso de escritura necesario

✅ **Git seguro**
- `.env.local` excluido automáticamente
- Sin secretos en el código

---

## 📱 Características Técnicas

### Responsive Design
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px+)
- ✅ Tablet (768px+)
- ✅ Móvil (375px+)

### Modo Oscuro
- ✅ Detección automática
- ✅ Todos los componentes compatibles
- ✅ Transiciones suaves

### Performance
- ✅ Carga rápida
- ✅ Actualización en tiempo real
- ✅ Paginación eficiente

---

## 🎓 Aprender Más

### Estructura del Proyecto
```
app/           → Páginas y API routes
components/    → Componentes React
lib/           → Lógica de negocio
types/         → Tipos TypeScript
```

### Flujo de Datos
```
Usuario → app/page.tsx → /api/usage → DynamoDB/Mock → Estadísticas → UI
```

### Agregar Funcionalidades
1. **Nuevo gráfico**: Crea componente en `components/`
2. **Nueva métrica**: Modifica `lib/stats.ts`
3. **Nuevo modelo**: Actualiza `lib/openai-pricing.ts`

---

## 💡 Consejos

### Para Desarrollo
```bash
npm run dev    # Inicia servidor con hot reload
```

### Para Producción
```bash
npm run build  # Compila versión optimizada
npm start      # Ejecuta versión de producción
```

### Para Depurar
1. Abre DevTools (F12)
2. Revisa la consola
3. Inspecciona Network para ver API calls

---

## 🆘 Problemas Comunes

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### No se muestran datos
1. Verifica que el servidor esté corriendo
2. Revisa la consola del navegador
3. Confirma que la API responde en `/api/usage`

### Error de DynamoDB
1. Verifica credenciales en `.env.local`
2. Confirma permisos de lectura
3. Usa modo demo para testing

---

## 🎁 Incluye

✅ Datos de ejemplo (10 registros)  
✅ Configuración completa  
✅ Documentación detallada  
✅ Componentes reutilizables  
✅ Estilos profesionales  
✅ Modo oscuro  
✅ Responsive design  
✅ TypeScript completo  
✅ Cálculos automáticos  
✅ Gráficos interactivos  

---

## 🚀 ¡Empieza Ahora!

```bash
npm install && npm run dev
```

Luego visita: **http://localhost:3000**

---

## 📞 Recursos Adicionales

- **AWS DynamoDB**: https://aws.amazon.com/dynamodb/
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Recharts**: https://recharts.org/

---

**¡Disfruta tu nuevo dashboard!** 🎉

Si tienes preguntas, revisa la documentación o los comentarios en el código.

