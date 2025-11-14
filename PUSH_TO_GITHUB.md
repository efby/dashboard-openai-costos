# 🚀 Subir Código a GitHub

Tu repositorio está creado en: https://github.com/efby/dashboard-openai-costos

## Ejecuta estos comandos:

```bash
cd "/Users/raulrodriguez/Documents/EFBY/PROYECTO_POLITICA/panel de estadistica"

# Conectar con tu repositorio
git remote add origin https://github.com/efby/dashboard-openai-costos.git

# Renombrar rama a main
git branch -M main

# Subir el código
git push -u origin main
```

## 🔐 Si te pide usuario y contraseña:

**Importante**: GitHub ya no acepta contraseñas normales. Necesitas usar un **Personal Access Token**.

### Opción 1: Usar GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI
brew install gh

# Autenticar
gh auth login

# Subir código
git push -u origin main
```

### Opción 2: Crear Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Selecciona scope: `repo` (acceso completo)
4. Copia el token (se muestra solo una vez)
5. Cuando git pida contraseña, usa el **token** en lugar de tu contraseña

### Opción 3: Usar SSH (Más seguro)

```bash
# Cambiar remote a SSH
git remote remove origin
git remote add origin git@github.com:efby/dashboard-openai-costos.git

# Si no tienes SSH key configurada:
# 1. Genera una key
ssh-keygen -t ed25519 -C "tu-email@example.com"

# 2. Copia la key pública
cat ~/.ssh/id_ed25519.pub

# 3. Agrégala en: https://github.com/settings/keys

# Ahora sí, sube el código
git push -u origin main
```

---

## ✅ Resultado Esperado

Deberías ver:

```
Enumerating objects: 30, done.
Counting objects: 100% (30/30), done.
Delta compression using up to 8 threads
Compressing objects: 100% (26/26), done.
Writing objects: 100% (30/30), 150.00 KiB | 10.00 MiB/s, done.
Total 30 (delta 2), reused 0 (delta 0)
To https://github.com/efby/dashboard-openai-costos.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🎯 Siguiente Paso: Vercel

Una vez que el código esté en GitHub:

1. Ve a: **https://vercel.com/new**
2. Click "Import" en tu repositorio `dashboard-openai-costos`
3. Agrega las variables de entorno:
   ```
   AWS_REGION = us-east-1
   AWS_ACCESS_KEY_ID = [TU_AWS_ACCESS_KEY_ID]
   AWS_SECRET_ACCESS_KEY = [TU_AWS_SECRET_ACCESS_KEY]
   DYNAMODB_TABLE_NAME = estadisticas_openai
   DEMO_MODE = false
   ```
4. Click "Deploy"

---

## 🆘 Problemas Comunes

### Error: "Authentication failed"
- Usa un Personal Access Token en lugar de tu contraseña
- O configura SSH

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/efby/dashboard-openai-costos.git
```

### Error: "Permission denied"
- Verifica que seas el dueño del repositorio
- Revisa tus permisos en GitHub

