#!/bin/bash
# Script para subir el proyecto a GitHub

echo "🚀 Subiendo Dashboard de Costos OpenAI a GitHub..."
echo ""
echo "⚠️  IMPORTANTE: Primero crea un repositorio en:"
echo "   https://github.com/new"
echo ""
read -p "Pega aquí la URL de tu repositorio GitHub: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: URL vacía"
    exit 1
fi

echo ""
echo "📦 Configurando repositorio remoto..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "🌿 Renombrando rama a main..."
git branch -M main

echo "⬆️  Subiendo código..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Código subido exitosamente!"
    echo ""
    echo "📝 Próximos pasos:"
    echo "1. Ve a: https://vercel.com/new"
    echo "2. Importa tu repositorio"
    echo "3. Agrega las variables de entorno:"
    echo "   - AWS_REGION=us-east-1"
    echo "   - AWS_ACCESS_KEY_ID=[TU_AWS_ACCESS_KEY]"
    echo "   - AWS_SECRET_ACCESS_KEY=[TU_AWS_SECRET_KEY]"
    echo "   - DYNAMODB_TABLE_NAME=[TU_TABLA]"
    echo "   - DEMO_MODE=false"
    echo "4. Click en 'Deploy'"
    echo ""
    echo "🎉 ¡Tu dashboard estará online en 2-3 minutos!"
else
    echo ""
    echo "❌ Error al subir. Verifica:"
    echo "   - Que creaste el repositorio en GitHub"
    echo "   - Que la URL es correcta"
    echo "   - Que tienes permisos para subir"
fi

