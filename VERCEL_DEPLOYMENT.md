# 🚀 Despliegue en Vercel (Solo Frontend)

## 📋 Arquitectura

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel         │  API    │   Railway        │
│  (Frontend)     │ ─────-> │   (Backend)      │
│  Static Files   │         │   SMTP + API     │
└─────────────────┘         └──────────────────┘
```

- **Vercel**: Sirve el frontend estático (HTML, CSS, JS)
- **Railway**: Ejecuta el backend (API + SMTP + WebSocket)

---

## ⚙️ Configuración Actual

### `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://fulfilling-cooperation-production.up.railway.app/api/:path*"
    }
  ]
}
```

### Flujo de las Peticiones API

1. Usuario visita `tu-app.vercel.app`
2. Frontend hace request a `/api/generate-email`
3. Vercel **redirecciona** a Railway: `https://fulfilling-cooperation-production.up.railway.app/api/generate-email`
4. Railway procesa y responde
5. Frontend recibe la respuesta

---

## 🛠️ Configuración en Vercel Dashboard

### 1. Build & Development Settings
```
Framework Preset: None (Other)
Build Command: cd client && npm install && npm run build
Output Directory: client/dist
Install Command: npm install
```

### 2. Environment Variables
No se necesitan variables de entorno especiales para el frontend.

---

## 📦 ¿Qué se Despliega?

✅ **Archivos estáticos del cliente:**
- `client/dist/index.html`
- `client/dist/assets/*.js`
- `client/dist/assets/*.css`
- `client/dist/mail.svg`
- `client/dist/manifest.json`
- `client/dist/sw.js`

❌ **NO se despliega:**
- Backend (`server/`)
- Dependencias de Node.js del backend
- Archivos de configuración de Railway

---

## 🚀 Pasos para Desplegar

### Opción A: Desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente `vercel.json`
4. Haz clic en "Deploy"
5. ¡Listo! Tu frontend estará en `https://tu-proyecto.vercel.app`

### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

---

## ✅ Verificar Despliegue

Después del despliegue, verifica:

1. **Frontend carga:** Abre `https://tu-proyecto.vercel.app`
2. **API funciona:** Genera un email
3. **Backend responde:** Verifica que las peticiones llegan a Railway

### Console del Navegador
```javascript
// Verifica que las peticiones van a Railway
// Network tab → /api/generate-email → Headers
// Request URL: https://fulfilling-cooperation-production.up.railway.app/api/generate-email
```

---

## 🔧 Troubleshooting

### Error: "No Output Directory named 'dist' found"
✅ **Solucionado** - `vercel.json` ahora especifica `"outputDirectory": "client/dist"`

### Error: "API calls fail with CORS"
Verifica que Railway tenga CORS habilitado:
```javascript
// server/index-mailtm.js
app.use(cors()); // ✅ Ya está configurado
```

### Error: "WebSocket connection failed"
⚠️ WebSocket **no funcionará** desde Vercel porque el frontend está en un dominio diferente.

**Solución:** Desactiva WebSocket en producción (ya está configurado):
```javascript
// client/src/App.jsx
if (!currentEmail || import.meta.env.PROD) return;
// WebSocket solo en desarrollo local
```

---

## 📊 Comparación: Vercel vs Railway

| Característica | Vercel | Railway |
|---|---|---|
| **Frontend** | ✅ Excelente | ✅ Bueno |
| **Backend** | ⚠️ Limitado (Serverless) | ✅ Excelente |
| **SMTP Server** | ❌ No soportado | ✅ Soportado |
| **WebSocket** | ⚠️ Limitado | ✅ Completo |
| **Build Speed** | ✅ Muy rápido | ⚠️ Más lento |
| **CDN Global** | ✅ Sí | ⚠️ No |

---

## 🎯 Recomendación

### Para tu aplicación, usa:

```
Frontend: Vercel (rápido, CDN global)
Backend: Railway (SMTP + WebSocket)
```

### O simplemente:

```
Todo en Railway (más simple, todo en un lugar)
```

Si prefieres **simplicidad**, mantén todo en Railway. Si prefieres **velocidad del frontend**, usa Vercel + Railway.

---

## 🔗 URLs

- **Frontend (Vercel):** `https://tu-proyecto.vercel.app`
- **Backend (Railway):** `https://fulfilling-cooperation-production.up.railway.app`
- **API Endpoint:** Las peticiones a `/api/*` se redirigen automáticamente a Railway

---

## 📝 Actualizar Backend URL

Si cambias la URL de Railway, actualiza `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://TU-NUEVA-URL.up.railway.app/api/:path*"
    }
  ]
}
```

---

¡Listo para desplegar! 🚀
