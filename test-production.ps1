# Script para probar la configuración de producción localmente
# antes de desplegar en Railway

Write-Host "🧪 Probando configuración de producción..." -ForegroundColor Cyan

# 1. Build del frontend
Write-Host "`n📦 Construyendo frontend..." -ForegroundColor Yellow
Set-Location client
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir el frontend" -ForegroundColor Red
    exit 1
}

# Verificar que el build existe
if (-not (Test-Path "dist/index.html")) {
    Write-Host "❌ dist/index.html no existe" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist/assets")) {
    Write-Host "❌ dist/assets/ no existe" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend construido correctamente" -ForegroundColor Green
Write-Host "   - index.html: $(Test-Path 'dist/index.html')" -ForegroundColor Gray
Write-Host "   - assets: $(Test-Path 'dist/assets')" -ForegroundColor Gray

Set-Location ..

# 2. Iniciar servidor en modo producción
Write-Host "`n🚀 Iniciando servidor en modo producción..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:PORT = 3001

Write-Host "Variables de entorno:" -ForegroundColor Gray
Write-Host "   NODE_ENV = $env:NODE_ENV" -ForegroundColor Gray
Write-Host "   PORT = $env:PORT" -ForegroundColor Gray

# Iniciar servidor en background
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server/index-mailtm.js" -PassThru -NoNewWindow

Start-Sleep -Seconds 5

# 3. Probar endpoints
Write-Host "`n🧪 Probando endpoints..." -ForegroundColor Yellow

# Health check
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
    Write-Host "✅ /api/health - OK" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ /api/health - ERROR" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force
    exit 1
}

# Info
try {
    $info = Invoke-RestMethod -Uri "http://localhost:3001/api/info" -Method Get
    Write-Host "✅ /api/info - OK" -ForegroundColor Green
    Write-Host "   Platform: $($info.platform)" -ForegroundColor Gray
} catch {
    Write-Host "❌ /api/info - ERROR" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force
    exit 1
}

# Root (index.html)
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/" -Method Get
    if ($response.Content -match "<html") {
        Write-Host "✅ / - HTML servido correctamente" -ForegroundColor Green
        Write-Host "   Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Gray
    } else {
        Write-Host "❌ / - No es HTML válido" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ / - ERROR" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force
    exit 1
}

# 4. Verificar rate limiting
Write-Host "`n🔒 Probando rate limiting..." -ForegroundColor Yellow
$headers = @{}
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/info" -Method Get
        $headers = $response.Headers
        Write-Host "   Request $i - OK (Remaining: $($headers.'X-RateLimit-Remaining'))" -ForegroundColor Gray
    } catch {
        Write-Host "   Request $i - ERROR" -ForegroundColor Red
    }
}

Write-Host "`n✅ Todas las pruebas pasaron correctamente" -ForegroundColor Green
Write-Host "`n📝 Siguiente paso:" -ForegroundColor Cyan
Write-Host "   1. Abre http://localhost:3001 en tu navegador" -ForegroundColor White
Write-Host "   2. Verifica que la app funciona correctamente" -ForegroundColor White
Write-Host "   3. Si todo está bien, haz push a Railway:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m 'fix: Resolver errores en Railway'" -ForegroundColor Gray
Write-Host "      git push origin main" -ForegroundColor Gray

Write-Host "`n⏹️  Presiona Enter para detener el servidor..." -ForegroundColor Yellow
Read-Host

# Detener servidor
Stop-Process -Id $serverProcess.Id -Force
Write-Host "✅ Servidor detenido" -ForegroundColor Green
