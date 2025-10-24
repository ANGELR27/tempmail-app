#!/bin/bash
set -e

echo "🔨 Iniciando build para Railway..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm install --production

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd client
npm install

# Construir frontend
echo "🏗️ Construyendo frontend..."
npm run build

# Verificar que el build existe
if [ ! -d "dist" ]; then
  echo "❌ Error: No se creó la carpeta dist"
  exit 1
fi

echo "✅ Build completado exitosamente"
ls -la dist/

cd ..
