# 🚀 TempMail - Versión Vercel (Demo)

## ⚠️ Limitación Importante

Esta versión desplegada en Vercel es una **DEMOSTRACIÓN** con limitaciones:

- ❌ **NO recibe emails reales** (Vercel no soporta servidores SMTP)
- ❌ **No tiene WebSocket** en tiempo real
- ✅ **Funciona la interfaz completa**
- ✅ **Puedes simular recepción de emails**

## 🎯 Para Uso Real

Si necesitas recibir emails SMTP reales, despliega en:
- **Railway** (recomendado, muy fácil)
- **DigitalOcean**
- **AWS EC2**
- **VPS con Node.js**

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones completas.

## 🧪 Cómo Simular Emails en Vercel

### 1. Genera un email temporal
Visita la aplicación y genera un email: `abc123@tempmail.local`

### 2. Simula la recepción de un email

**Con curl:**
```bash
curl -X POST https://tu-app.vercel.app/api/simulate-email/abc123@tempmail.local \
  -H "Content-Type: application/json" \
  -d '{
    "from": "demo@example.com",
    "subject": "Email de Prueba",
    "text": "Este es un email simulado"
  }'
```

**Con JavaScript:**
```javascript
const response = await fetch('https://tu-app.vercel.app/api/simulate-email/abc123@tempmail.local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'test@example.com',
    subject: 'Hola!',
    text: 'Este es un mensaje de prueba'
  })
});
```

### 3. Recarga la bandeja
El email aparecerá automáticamente en la interfaz.

## 🌐 Desplegar a Vercel

### Opción A: Desde GitHub (Recomendado)

1. **Sube el código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/tempmail-app.git
git push -u origin main
```

2. **Ve a Vercel:**
- Visita [vercel.com](https://vercel.com)
- Click "New Project"
- Importa tu repositorio
- Click "Deploy"

### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

## 📦 Configuración en Vercel

**Build Settings:**
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

**Environment Variables:**
- `NODE_ENV`: `production`

## 🔧 Arquitectura en Vercel

```
Vercel Deployment
├── Frontend (React + Vite)
│   └── /client/dist/
├── Serverless Functions
│   └── /api/index.js
└── Static Assets
```

## 📱 Características Funcionando

✅ Interfaz de usuario completa  
✅ Generación de emails temporales  
✅ Bandeja de entrada  
✅ Visor de mensajes  
✅ Eliminación de mensajes  
✅ Copia al portapapeles  
✅ Diseño responsive  

## 🚫 Características Deshabilitadas

❌ Recepción SMTP real  
❌ WebSocket en tiempo real  
❌ Persistencia entre despliegues  

## 💡 Alternativas para Producción

### 1. Railway (Recomendado - $5/mes)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. DigitalOcean ($6/mes)
- Droplet con Node.js
- Configurar DNS
- Instalar la app completa

### 3. Usar API Externa
Integrar con Mail.tm o Guerrilla Mail API

## 🔗 Links Útiles

- [Documentación Vercel](https://vercel.com/docs)
- [Guía de Despliegue Completa](./DEPLOYMENT.md)
- [Railway Docs](https://docs.railway.app)

---

**Nota:** Esta es una aplicación de demostración. Para uso en producción con recepción real de emails, se requiere un servidor VPS o plataforma compatible con servidores TCP persistentes.
