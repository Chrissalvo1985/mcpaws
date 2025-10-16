#!/bin/bash

set -e

echo "🚀 Desplegando en Vercel..."
echo ""

# Leer variables del .env
source .env

# Configurar variables de entorno en Vercel
echo "📝 Configurando variables de entorno..."

vercel env add AWS_ACCESS_KEY_ID production <<< "$AWS_ACCESS_KEY_ID" 2>/dev/null || echo "AWS_ACCESS_KEY_ID ya existe"
vercel env add AWS_SECRET_ACCESS_KEY production <<< "$AWS_SECRET_ACCESS_KEY" 2>/dev/null || echo "AWS_SECRET_ACCESS_KEY ya existe"
vercel env add AWS_REGION production <<< "${AWS_REGION:-us-east-1}" 2>/dev/null || echo "AWS_REGION ya existe"
vercel env add DB_CLUSTER_ARN production <<< "${DB_CLUSTER_ARN:-}" 2>/dev/null || echo "DB_CLUSTER_ARN ya existe"
vercel env add DB_SECRET_ARN production <<< "${DB_SECRET_ARN:-}" 2>/dev/null || echo "DB_SECRET_ARN ya existe"
vercel env add DB_NAME production <<< "${DB_NAME:-postgres}" 2>/dev/null || echo "DB_NAME ya existe"
vercel env add API_SECRET_KEY production <<< "$API_SECRET_KEY" 2>/dev/null || echo "API_SECRET_KEY ya existe"

echo ""
echo "✅ Variables configuradas"
echo ""
echo "🚢 Desplegando a producción..."

vercel --prod

echo ""
echo "✅ Deploy completado!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ve a AWS Console y crea/obtén tus ARNs de RDS"
echo "   2. Actualiza las variables en Vercel Dashboard"
echo "   3. Prueba tu API"

