# 🚀 Guía de Despliegue

Esta guía te muestra cómo desplegar tu Dashboard de Costos OpenAI en diferentes plataformas.

---

## 📊 Comparación de Opciones

| Plataforma | Facilidad | Costo | Velocidad | AWS Native |
|------------|-----------|-------|-----------|------------|
| **Vercel** | ⭐⭐⭐⭐⭐ | Gratis | Muy rápido | ❌ |
| **AWS Amplify** | ⭐⭐⭐⭐ | ~$5-15/mes | Rápido | ✅ |
| **AWS EC2** | ⭐⭐ | ~$5-20/mes | Medio | ✅ |
| **AWS App Runner** | ⭐⭐⭐⭐ | ~$5-15/mes | Rápido | ✅ |

---

## 1️⃣ Vercel (Recomendado - Más Fácil)

### Ventajas
- ✅ Despliegue en 5 minutos
- ✅ Gratis para proyectos personales
- ✅ HTTPS automático
- ✅ CDN global incluido
- ✅ Actualizaciones automáticas desde Git

### Pasos

#### 1. Crear cuenta en Vercel
Ve a: https://vercel.com/signup

#### 2. Subir código a GitHub

```bash
# Si no tienes un repositorio remoto
# Crea uno en https://github.com/new

# Luego conecta y sube
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git commit -m "Initial commit: Dashboard OpenAI"
git push -u origin main
```

#### 3. Importar en Vercel

1. En Vercel, click "Import Project"
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente que es Next.js

#### 4. Configurar Variables de Entorno

En el panel de Vercel, agrega estas variables:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[TU_AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[TU_AWS_SECRET_ACCESS_KEY]
DYNAMODB_TABLE_NAME=estadisticas_openai
DEMO_MODE=false
```

#### 5. Desplegar

Click "Deploy" y en 2-3 minutos tendrás tu URL:
`https://tu-proyecto.vercel.app`

### Actualizaciones Automáticas

Cada vez que hagas `git push`, Vercel desplegará automáticamente.

---

## 2️⃣ AWS Amplify (Mejor opción AWS)

### Ventajas
- ✅ Todo en AWS (misma cuenta)
- ✅ Integración perfecta con DynamoDB
- ✅ CDN de CloudFront incluido
- ✅ CI/CD automático

### Pasos

#### 1. Subir a Git (GitHub, GitLab o CodeCommit)

```bash
# GitHub
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git commit -m "Initial commit"
git push -u origin main
```

#### 2. Crear App en Amplify

1. Ve a: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Conecta tu repositorio Git
4. Selecciona la rama `main`

#### 3. Configurar Build

Amplify detectará Next.js automáticamente. Si no, usa:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 4. Variables de Entorno

En Amplify Console → Environment variables:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
DYNAMODB_TABLE_NAME=tu_tabla_dynamodb
```

#### 5. Permisos IAM

Amplify necesita acceso a DynamoDB:

1. Ve a IAM → Roles
2. Busca el rol de Amplify
3. Agrega la política:

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
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/estadisticas_openai"
    }
  ]
}
```

#### 6. Desplegar

Click "Save and deploy"

Tu app estará en: `https://main.XXXXX.amplifyapp.com`

### Dominio Personalizado

En Amplify → Domain management → Add domain

---

## 3️⃣ AWS App Runner (Alternativa Moderna)

### Ventajas
- ✅ Más simple que EC2
- ✅ Escala automáticamente
- ✅ Solo pagas por uso

### Pasos

#### 1. Crear Dockerfile

```dockerfile
# Crear archivo: Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. Subir a ECR o GitHub

```bash
# Con GitHub (más fácil)
git add Dockerfile
git commit -m "Add Dockerfile"
git push
```

#### 3. Crear Servicio en App Runner

1. Ve a: https://console.aws.amazon.com/apprunner/
2. "Create service"
3. Source: GitHub
4. Branch: main
5. Runtime: Node.js 20
6. Port: 3000

#### 4. Variables de Entorno

Igual que antes, agregar las credenciales AWS.

---

## 4️⃣ AWS EC2 (Control Total)

### Para usuarios avanzados

#### 1. Crear instancia EC2

- AMI: Ubuntu 22.04 LTS
- Tipo: t3.micro (o t3.small)
- Security Group: Puerto 80, 443, 22

#### 2. Conectar y configurar

```bash
# Conectar
ssh -i tu-key.pem ubuntu@tu-ip-ec2

# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Instalar PM2
npm install -g pm2

# Clonar repositorio
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

#### 3. Configurar variables de entorno

```bash
# Crear .env.local
nano .env.local

# Pegar:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[TU_AWS_ACCESS_KEY_ID]
AWS_SECRET_ACCESS_KEY=[TU_AWS_SECRET_ACCESS_KEY]
DYNAMODB_TABLE_NAME=estadisticas_openai
```

#### 4. Instalar y ejecutar

```bash
npm install
npm run build

# Ejecutar con PM2 (para que siempre esté activo)
pm2 start npm --name "dashboard-openai" -- start
pm2 save
pm2 startup
```

#### 5. Configurar Nginx (opcional)

```bash
sudo apt install nginx

# Configurar proxy
sudo nano /etc/nginx/sites-available/default

# Agregar:
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

sudo systemctl restart nginx
```

---

## 🔐 Seguridad en Producción

### 1. Variables de Entorno

**NUNCA** hagas commit de `.env.local` al repositorio.

✅ Siempre usar variables de entorno de la plataforma.

### 2. Permisos IAM Mínimos

Crea un usuario IAM específico solo con:
- `dynamodb:Scan` en tu tabla
- `dynamodb:Query` (opcional)

### 3. Rotar Credenciales

Cambia las claves AWS cada 90 días.

### 4. HTTPS

Todas las plataformas mencionadas incluyen HTTPS automático.

---

## 📊 Costos Estimados

| Plataforma | Costo Mensual | Tráfico Incluido |
|------------|---------------|------------------|
| Vercel (Hobby) | **$0** | 100GB |
| Vercel (Pro) | $20 | 1TB |
| AWS Amplify | $5-15 | Depende del uso |
| AWS App Runner | $5-15 | Pay per use |
| AWS EC2 t3.micro | $8 | Ilimitado* |

*Sujeto a límites de AWS Free Tier

---

## 🚀 Recomendación Final

### Para Empezar Rápido: **Vercel**
- Gratis
- 5 minutos de setup
- Perfecto para proyectos personales

### Para Producción en AWS: **AWS Amplify**
- Todo en AWS
- Integración perfecta
- Escalable

### Para Control Total: **AWS EC2**
- Flexibilidad máxima
- Más trabajo de configuración
- Ideal para empresas

---

## 🆘 Troubleshooting

### Error: "Cannot connect to DynamoDB"

1. Verifica las variables de entorno
2. Confirma permisos IAM
3. Revisa la región AWS

### Error: "Build failed"

```bash
# Probar build localmente
npm run build

# Si funciona local pero falla en deploy:
# - Verifica versión de Node.js (20)
# - Revisa logs de la plataforma
```

### La app carga pero no muestra datos

1. Abre DevTools (F12) → Console
2. Revisa errores en `/api/usage`
3. Verifica que `DEMO_MODE=false`

---

## 📝 Siguiente Paso

1. Elige una plataforma (recomiendo Vercel)
2. Sigue los pasos de esa sección
3. En 10 minutos tendrás tu dashboard online

¿Preguntas? Revisa los logs de tu plataforma elegida.

