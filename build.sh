#!/bin/bash
echo "📦 Instalando dependencias del backend..."
npm install --production

echo "📦 Instalando dependencias del frontend..."
cd client && npm install

echo "🏗️ Construyendo frontend..."
npm run build

echo "✅ Build completado!"
