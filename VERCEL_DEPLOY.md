# 🚀 Despliegue en Vercel - Guía Visual

## ⏱️ Tiempo total: 10 minutos

---

## 📝 Paso 1: Crear Repositorio en GitHub (2 min)

### 1.1 Ir a GitHub
```
🌐 Abre: https://github.com/new
```

### 1.2 Configurar Repositorio
```
Repository name:      dashboard-openai-costos
Description:          Dashboard de análisis de costos OpenAI
Visibility:           🔒 Private (recomendado)

⚠️ NO marques ninguna opción adicional
   ❌ Add a README file
   ❌ Add .gitignore
   ❌ Choose a license
```

### 1.3 Crear
```
Click: [Create repository]
```

### 1.4 Copiar URL
Verás algo como:
```
https://github.com/TU_USUARIO/dashboard-openai-costos.git
```
**¡Copia esta URL!**

---

## 📤 Paso 2: Subir Código a GitHub (1 min)

### Opción A: Script Automático

```bash
cd "/Users/raulrodriguez/Documents/EFBY/PROYECTO_POLITICA/panel de estadistica"
./deploy-to-github.sh
# Pega tu URL cuando te lo pida
```

### Opción B: Manual

```bash
cd "/Users/raulrodriguez/Documents/EFBY/PROYECTO_POLITICA/panel de estadistica"

# Conectar con GitHub (reemplaza con TU URL)
git remote add origin https://github.com/TU_USUARIO/dashboard-openai-costos.git

# Renombrar rama
git branch -M main

# Subir código
git push -u origin main
```

**Resultado esperado:**
```
✅ main -> main
✅ Branch 'main' set up to track remote branch 'main'
```

---

## 🎯 Paso 3: Crear Cuenta en Vercel (1 min)

### 3.1 Ir a Vercel
```
🌐 Abre: https://vercel.com/signup
```

### 3.2 Registrarse
```
Click: [Continue with GitHub]
```

### 3.3 Autorizar
```
Vercel pedirá acceso a tus repositorios
Click: [Authorize Vercel]
```

---

## 🚀 Paso 4: Importar Proyecto (3 min)

### 4.1 Nuevo Proyecto
```
En Vercel Dashboard:
Click: [Add New...] → [Project]
```

### 4.2 Seleccionar Repositorio
```
Busca: dashboard-openai-costos
Click: [Import]
```

### 4.3 Configuración del Proyecto

Vercel detectará automáticamente Next.js:

```
Framework Preset:    Next.js ✅
Root Directory:      ./
Build Command:       npm run build
Output Directory:    .next
Install Command:     npm install
```

**⚠️ NO hagas click en Deploy todavía**

---

## 🔐 Paso 5: Variables de Entorno (3 min)

### 5.1 Agregar Variables

Click en: **Environment Variables**

Agrega estas 5 variables **UNA POR UNA**:

#### Variable 1:
```
Name:    AWS_REGION
Value:   us-east-1
```
Click: [Add]

#### Variable 2:
```
Name:    AWS_ACCESS_KEY_ID
Value:   [TU_AWS_ACCESS_KEY]
```
Click: [Add]

#### Variable 3:
```
Name:    AWS_SECRET_ACCESS_KEY
Value:   [TU_AWS_SECRET_KEY]
```
Click: [Add]

#### Variable 4:
```
Name:    DYNAMODB_TABLE_NAME
Value:   estadisticas_openai
```
Click: [Add]

#### Variable 5:
```
Name:    DEMO_MODE
Value:   false
```
Click: [Add]

### 5.2 Verificar

Deberías ver 5 variables en la lista:
```
✅ AWS_REGION
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ DYNAMODB_TABLE_NAME
✅ DEMO_MODE
```

---

## 🎉 Paso 6: Deploy

### 6.1 Desplegar
```
Click: [Deploy]
```

### 6.2 Esperar
Verás el progreso:
```
⏳ Building...
⏳ Deploying...
✅ Success!
```

**Tiempo estimado: 2-3 minutos**

### 6.3 Ver tu Dashboard

Vercel te mostrará una URL como:
```
🌐 https://dashboard-openai-costos.vercel.app
```

**¡Click y disfruta tu dashboard online!**

---

## 📱 Características Incluidas

✅ **HTTPS automático** (certificado SSL gratis)  
✅ **CDN global** (carga rápida en todo el mundo)  
✅ **Auto-deploy** (cada push a GitHub despliega automáticamente)  
✅ **Preview URLs** (cada PR tiene su URL de prueba)  
✅ **Analytics** (estadísticas de uso)  
✅ **Logs** (ver errores y logs del servidor)  

---

## 🔄 Actualizaciones Futuras

### Hacer cambios:

1. **Edita tu código localmente**

2. **Sube cambios:**
```bash
git add .
git commit -m "Descripción del cambio"
git push
```

3. **Vercel desplegará automáticamente** 🚀

---

## 🌐 Dominio Personalizado (Opcional)

### Si tienes un dominio propio:

1. En Vercel → Tu Proyecto → Settings → Domains
2. Add Domain → Escribe tu dominio
3. Sigue las instrucciones de DNS

Ejemplo: `dashboard.tuempresa.com`

---

## 📊 Ver Logs y Estadísticas

### Ver logs en tiempo real:

```
Vercel Dashboard → Tu Proyecto → Deployments → Ver deployment → View Function Logs
```

### Analytics:

```
Vercel Dashboard → Tu Proyecto → Analytics
```

---

## 🆘 Troubleshooting

### Error: "Build Failed"

**Solución:**
1. Ve a Vercel → Deployment → View Build Logs
2. Copia el error
3. Verifica que package.json esté correcto

### Error: "Cannot read from DynamoDB"

**Solución:**
1. Vercel → Settings → Environment Variables
2. Verifica que todas las 5 variables estén correctas
3. Redeploy: Deployments → ... → Redeploy

### La app carga pero no muestra datos

**Solución:**
1. Abre DevTools (F12) → Console
2. Ve a Network → /api/usage
3. Revisa la respuesta
4. Verifica permisos IAM en AWS

---

## ✨ URLs Útiles

| Recurso | URL |
|---------|-----|
| **Dashboard Vercel** | https://vercel.com/dashboard |
| **Documentación** | https://vercel.com/docs |
| **GitHub Repo** | Tu URL de GitHub |
| **Tu Dashboard Live** | `https://tu-proyecto.vercel.app` |

---

## 💡 Tips Pro

### 1. Protection de Producción
```
Settings → General → Production Branch
Cambia a "main"
```

### 2. Prevenir Deploys Accidentales
```
Settings → Git → Ignored Build Step
Agrega: git diff HEAD^ HEAD --quiet . ':(exclude)README.md'
```

### 3. Notificaciones
```
Settings → Notifications
Configura Slack/Discord para recibir notificaciones
```

---

## 🎓 Próximos Pasos

1. ✅ Comparte la URL con tu equipo
2. ✅ Configura un dominio personalizado
3. ✅ Monitorea el uso en Analytics
4. ✅ Revisa los costos en AWS

---

## 📞 Soporte

- **Vercel Discord**: https://vercel.com/discord
- **Vercel Docs**: https://vercel.com/docs
- **Status**: https://vercel-status.com

---

**¡Felicidades! Tu dashboard está online y accesible desde cualquier parte del mundo! 🌍**

