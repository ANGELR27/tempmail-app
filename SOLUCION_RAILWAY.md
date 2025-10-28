# 🚀 Solución: Errores en Railway y Local

## 🔍 Problemas Identificados

### En Railway:
1. **Error 429 (Too Many Requests)**: El rate limiter era muy estricto (30 req/min)
2. **Página en blanco**: Los archivos estáticos se bloqueaban por el rate limiter
3. **Polling agresivo**: 5 segundos en producción generaba muchas peticiones

### En Local:
4. **Error "Unexpected end of JSON input"**: Mail.tm no respondía correctamente
5. **Falta de reintentos**: El sistema fallaba al primer error
6. **Logs insuficientes**: Difícil diagnosticar problemas

## ✅ Cambios Implementados

### 1. Rate Limiter más permisivo
**Archivo**: `server/index-mailtm.js` (línea 118)

```javascript
// ANTES: app.use('/api/', rateLimiters.normal); // 30 req/min
// AHORA: app.use('/api/', rateLimiters.relaxed); // 100 req/min
```

### 2. Polling más lento en producción
**Archivo**: `client/src/App.jsx` (línea 371)

```javascript
useSmartPolling(pollingCallback, currentEmail, {
  minDelay: import.meta.env.PROD ? 15000 : 5000, // 15s en producción
  maxDelay: 120000, // 2 minutos máximo
  emptyThreshold: 3
});
```

### 3. Archivos estáticos ANTES del rate limiter
**Archivo**: `server/index-mailtm.js` (líneas 37-79)

Los archivos estáticos ahora se sirven **antes** de aplicar rate limiting y middlewares de parsing, evitando bloqueos.

### 4. Mejores headers MIME y cache
**Archivo**: `server/index-mailtm.js` (líneas 49-67)

- Content-Type correcto para JS, CSS, SVG, PNG, etc.
- Cache de 1 año para assets con hash
- Manejo mejorado de errores para index.html

### 5. Reintentos automáticos en Mail.tm
**Archivo**: `server/mailtm.js` (líneas 11-103)

- 3 intentos antes de fallar
- Backoff exponencial (1s, 2s, 4s)
- Validación completa de respuestas
- Timeouts configurados (10 segundos)

### 6. Mejor manejo de errores en el servidor
**Archivo**: `server/index-mailtm.js` (líneas 123-173)

- Logs detallados con emojis para debugging
- Redis opcional (funciona sin Redis)
- Mensajes de error específicos con contexto

### 7. Validación de respuestas en el frontend
**Archivo**: `client/src/App.jsx` (líneas 144-208)

- Validación de código de estado HTTP
- Validación de JSON antes de parsear
- Mensajes de error claros para el usuario
- Manejo de casos edge (respuestas vacías, etc.)

## 📝 Cómo Desplegar en Railway

### Opción 1: Despliegue automático (Git)

```bash
# 1. Hacer commit de los cambios
git add .
git commit -m "fix: Resolver errores 429 y página en blanco en Railway"

# 2. Push a Railway (se desplegará automáticamente)
git push origin main
```

### Opción 2: Despliegue manual

1. Ve a tu proyecto en Railway
2. Haz clic en "Deploy" → "Trigger Deploy"
3. Espera a que el build termine (~3-5 minutos)

## 🧪 Verificar el Despliegue

Después del despliegue, verifica:

### 1. Health Check
```bash
curl https://tu-app.railway.app/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "providers": { "mail.tm": { "available": true } },
  "activeProvider": "mail.tm",
  "redis": true
}
```

### 2. Archivos estáticos
- Abre la URL de tu app en el navegador
- Abre las DevTools (F12) → pestaña Network
- Recarga la página (Ctrl+R)
- Verifica que los archivos JS/CSS se cargan con **200 OK** (no 429)

### 3. Rate Limit Headers
```bash
curl -I https://tu-app.railway.app/api/info
```

Deberías ver headers como:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
```

## 🎯 Resultados Esperados

- ✅ La página carga correctamente (no más página en blanco)
- ✅ No más errores 429 (solo con uso excesivo)
- ✅ Polling más inteligente (15s → 2min según actividad)
- ✅ Archivos estáticos se cargan rápidamente con cache

## 🐛 Solución de Problemas

### Si la página sigue en blanco:

1. **Verifica los logs de Railway**:
   - Ve a tu proyecto → pestaña "Logs"
   - Busca: `📁 Sirviendo archivos estáticos desde:`
   - Asegúrate que el path existe

2. **Verifica el build**:
   ```bash
   # En tu máquina local
   cd client
   npm run build
   ls -la dist/
   ```
   - Debe existir `dist/index.html`
   - Debe existir `dist/assets/` con archivos JS/CSS

3. **Variables de entorno en Railway**:
   - `NODE_ENV=production` (debe estar configurada)
   - `PORT` (Railway lo asigna automáticamente)

### Si sigues recibiendo 429:

1. **Verifica que los cambios se desplegaron**:
   - Revisa los logs: `🚀 Servidor API escuchando...`
   - El log debe mostrar la versión correcta del código

2. **Límites de Railway**:
   - Railway también tiene sus propios rate limits
   - Si tienes tráfico muy alto, considera actualizar tu plan

## 📊 Monitoreo

Para ver el estado de tu app en tiempo real:

```bash
# Ver logs en tiempo real
railway logs

# Ver métricas
railway status
```

## 🔄 Rollback (si algo sale mal)

Si necesitas volver a la versión anterior:

```bash
# En Railway dashboard
# 1. Ve a Deployments
# 2. Encuentra el deployment anterior que funcionaba
# 3. Click en "..." → "Redeploy"
```

## 📞 Soporte Adicional

Si los problemas persisten:
1. Verifica los logs completos de Railway
2. Comparte los errores específicos en la consola del navegador
3. Verifica que todas las variables de entorno estén configuradas

---

**Última actualización**: Octubre 2025
