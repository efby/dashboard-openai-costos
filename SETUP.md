# Guía de Configuración

Esta guía te ayudará a configurar el Dashboard de Costos OpenAI paso a paso.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Una cuenta de AWS con acceso a DynamoDB
- Tabla de DynamoDB con datos de uso de OpenAI

## 🔧 Paso 1: Instalación de Dependencias

Abre una terminal en el directorio del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- Next.js 14
- React 18
- AWS SDK para DynamoDB
- Recharts para gráficos
- Tailwind CSS para estilos
- date-fns para manejo de fechas
- TypeScript y tipos

## 🔑 Paso 2: Configurar Credenciales de AWS

### 2.1 Crear archivo de variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

### 2.2 Obtener credenciales de AWS

1. **Accede a AWS Console**: https://console.aws.amazon.com
2. **Ir a IAM** (Identity and Access Management)
3. **Crear un usuario nuevo** o usar uno existente:
   - Ve a "Users" → "Add users"
   - Nombre: `dashboard-openai-user`
   - Tipo de acceso: "Programmatic access"
4. **Asignar permisos**:
   - Adjunta la política `AmazonDynamoDBReadOnlyAccess` 
   - O crea una política personalizada:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:Scan",
           "dynamodb:Query",
           "dynamodb:GetItem"
         ],
         "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/TU_TABLA"
       }
     ]
   }
   ```

5. **Guardar credenciales**: Al finalizar, obtendrás:
   - Access Key ID
   - Secret Access Key
   
   ⚠️ **IMPORTANTE**: Guarda estas credenciales de forma segura, no se volverán a mostrar.

### 2.3 Editar .env.local

Abre el archivo `.env.local` y completa los valores:

```env
# AWS Configuration
AWS_REGION=us-east-1                    # Tu región de AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Tu Access Key ID
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...  # Tu Secret Access Key
DYNAMODB_TABLE_NAME=openai-usage-table  # Nombre de tu tabla DynamoDB
```

## 📊 Paso 3: Verificar Estructura de Datos en DynamoDB

Tu tabla de DynamoDB debe contener objetos con esta estructura:

```json
{
  "id": "string (Primary Key)",
  "modelo_ai": "string",
  "nombre": "string",
  "nombre_candidato": "string",
  "promt_utilizado": "string",
  "timestamp": "string (ISO 8601)",
  "tipoPolitico": "string",
  "tipo_busqueda": "string",
  "ultimoCargo": "string | null",
  "usage": {
    "input_tokens": "number",
    "input_tokens_details": {
      "cached_tokens": "number"
    },
    "output_tokens": "number",
    "output_tokens_details": {
      "reasoning_tokens": "number"
    },
    "total_tokens": "number"
  }
}
```

## 🚀 Paso 4: Ejecutar la Aplicación

### Modo Desarrollo

```bash
npm run dev
```

Abre tu navegador en: http://localhost:3000

### Modo Producción

```bash
npm run build
npm start
```

## ✅ Paso 5: Verificar Funcionamiento

1. **Ver Dashboard**: Deberías ver el dashboard con todas las estadísticas
2. **Revisar Gráficos**: Verifica que los gráficos se muestren correctamente
3. **Tabla de Datos**: Comprueba que puedes ver, filtrar y ordenar los registros

## 🐛 Solución de Problemas

### Error: "DYNAMODB_TABLE_NAME no está configurado"

**Causa**: El archivo `.env.local` no existe o las variables no están correctamente configuradas.

**Solución**:
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Asegúrate de haber reiniciado el servidor después de crear/editar `.env.local`

### Error: "Error al conectar con DynamoDB"

**Causas posibles**:
1. Credenciales incorrectas
2. Región incorrecta
3. Tabla no existe
4. Permisos insuficientes

**Soluciones**:
1. Verifica las credenciales en `.env.local`
2. Confirma la región: `AWS_REGION=tu-region`
3. Verifica el nombre de la tabla en AWS Console
4. Revisa los permisos IAM del usuario

### Error: "No se muestran datos"

**Causa**: La tabla está vacía o no tiene el formato correcto.

**Solución**:
- Verifica que tu tabla tiene datos
- Comprueba que los objetos tienen la estructura correcta
- Revisa la consola del navegador (F12) para ver errores

### Problemas de Estilos

**Solución**:
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 🔐 Seguridad

### Buenas Prácticas:

1. **Nunca subas .env.local a Git**
   - Ya está en `.gitignore`
   
2. **Usa permisos mínimos**
   - Solo lectura en DynamoDB
   
3. **Rota credenciales regularmente**
   - Cambia las credenciales cada 90 días
   
4. **No expongas credenciales en el cliente**
   - Las API routes de Next.js se ejecutan en el servidor

## 📝 Siguiente Paso

Una vez que todo funcione correctamente, puedes:

1. Personalizar los colores en `tailwind.config.ts`
2. Ajustar los precios de modelos en `lib/openai-pricing.ts`
3. Añadir filtros de fecha personalizados
4. Implementar caché para mejor rendimiento

## 🆘 Ayuda

Si tienes problemas, verifica:

1. Logs del servidor en la terminal
2. Consola del navegador (F12)
3. Variables de entorno correctamente configuradas
4. Conexión a internet y AWS

