# 🚀 Inicio Rápido - Dashboard de Costos OpenAI

## ⚡ Comenzar en 2 minutos

### Paso 1: Instalar Dependencias

Abre una terminal en este directorio y ejecuta:

```bash
npm install
```

### Paso 2: Ejecutar la Aplicación

```bash
npm run dev
```

### Paso 3: Abrir en el Navegador

Abre tu navegador en: **http://localhost:3000**

🎉 **¡Listo!** La aplicación está funcionando en **modo demo** con datos de ejemplo.

---

## 🔄 Cambiar a Datos Reales (DynamoDB)

### 1. Crear archivo de configuración

Crea un archivo llamado `.env.local` en la raíz del proyecto:

```bash
touch .env.local
```

### 2. Agregar tus credenciales de AWS

Edita `.env.local` y agrega:

```env
# Desactivar modo demo
DEMO_MODE=false

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DYNAMODB_TABLE_NAME=mi-tabla-openai
```

### 3. Reiniciar el servidor

Detén el servidor (Ctrl+C) y vuelve a ejecutar:

```bash
npm run dev
```

---

## 📊 ¿Qué puedes ver en el Dashboard?

### Tarjetas de Estadísticas
- **Costo Total**: Gasto acumulado en dólares
- **Total Consultas**: Número de llamadas a la API
- **Tokens Totales**: Suma de todos los tokens usados
- **Costo Promedio**: Costo por consulta

### Gráficos Interactivos
- **Costos Diarios**: Evolución del gasto a lo largo del tiempo
- **Costos por Modelo**: Comparación entre GPT-4, GPT-3.5, etc.
- **Costos por Candidato**: Top 10 de candidatos con más consultas
- **Costos por Tipo de Búsqueda**: Distribución del gasto por tipo

### Tabla Detallada
- Historial completo de todas las consultas
- Filtros por modelo
- Ordenación por fecha o costo
- Paginación para grandes volúmenes de datos

---

## 🛠️ Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar versión de producción
npm start

# Verificar código
npm run lint
```

---

## 🆘 Problemas Comunes

### El servidor no inicia
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### No se muestran datos reales
1. Verifica que `.env.local` existe y tiene las credenciales correctas
2. Confirma que `DEMO_MODE=false` en `.env.local`
3. Reinicia el servidor después de editar `.env.local`

### Error de permisos en DynamoDB
1. Verifica tus credenciales AWS
2. Asegúrate de tener permisos de lectura (`dynamodb:Scan`)
3. Confirma que el nombre de la tabla es correcto

---

## 📚 Más Información

- **Documentación completa**: Ver `README.md`
- **Guía de configuración**: Ver `SETUP.md`
- **Estructura de datos**: Ver `types/openai-usage.ts`

---

## ✨ Características Adicionales

### Modo Oscuro
El dashboard detecta automáticamente las preferencias de tu sistema operativo.

### Responsive Design
Funciona perfectamente en desktop, tablet y móvil.

### Actualización en Tiempo Real
Haz clic en el botón "Actualizar" en el header para recargar los datos.

---

¿Necesitas ayuda? Revisa `SETUP.md` para instrucciones detalladas.

