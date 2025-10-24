# 🚀 Guía de Despliegue

## ⚠️ Importante: Limitaciones de Serverless

**Vercel y otras plataformas serverless NO soportan:**
- ❌ Servidores SMTP persistentes (puerto 2525)
- ❌ WebSockets persistentes
- ❌ Almacenamiento en memoria entre invocaciones

## 📦 Opciones de Despliegue

### Opción 1: Vercel (Frontend + API Demo) ✅ RECOMENDADO PARA DEMO

**Lo que funciona:**
- ✅ Frontend React completo
- ✅ API REST básica
- ✅ Simulación de emails
- ✅ Interfaz de usuario

**Lo que NO funciona:**
- ❌ Recepción real de emails SMTP
- ❌ WebSocket en tiempo real
- ❌ Persistencia entre recargas

**Pasos para Vercel:**

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Preparar el proyecto**
```bash
# Instalar dependencias
npm install
cd client && npm install && cd ..

# Build del frontend
cd client && npm run build && cd ..
```

3. **Desplegar**
```bash
vercel
```

4. **Configurar variables de entorno en Vercel Dashboard**
- `NODE_ENV=production`

### Opción 2: VPS Completo (Railway, DigitalOcean, AWS EC2) ✅ RECOMENDADO PARA PRODUCCIÓN

**Para recepción REAL de emails necesitas:**

#### Railway (Más fácil)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar
railway init

# Desplegar
railway up

# Configurar dominio custom
railway domain
```

#### DigitalOcean / AWS
1. Crear un Droplet/EC2
2. Instalar Node.js
3. Configurar dominio y DNS (MX records)
4. Instalar la aplicación
5. Usar PM2 para mantener el proceso vivo
6. Configurar Nginx como reverse proxy
7. SSL con Let's Encrypt

**Configuración DNS necesaria:**
```
# A record
tempmail.tudominio.com  A  IP_DEL_SERVIDOR

# MX record
tudominio.com  MX  10  tempmail.tudominio.com
```

### Opción 3: Híbrido (Vercel + VPS SMTP)

**Arquitectura:**
- Frontend en Vercel
- API REST en Vercel
- Servidor SMTP en VPS separado
- Base de datos compartida (Redis/Upstash)

### Opción 4: Usar API de Correo Temporal Existente

Integrar con servicios como:
- **Mail.tm API** (gratis)
- **Guerrilla Mail API**
- **10MinuteMail API**

## 🔧 Preparación para Producción

### 1. Base de Datos
Reemplaza Map por Redis:

```bash
npm install redis
# O usa Upstash Redis (serverless)
```

```javascript
// En lugar de Map
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});
```

### 2. Variables de Entorno
```env
# Production
NODE_ENV=production
REDIS_URL=redis://...
APP_DOMAIN=tempmail.tudominio.com
FRONTEND_URL=https://tempmail.vercel.app
```

### 3. Seguridad
- Rate limiting
- CORS configurado
- Validación de inputs
- Sanitización de HTML

## 📝 Despliegue a Vercel - Paso a Paso

### A. Preparar Repositorio Git

```bash
# Inicializar Git
git init

# Agregar archivos
git add .
git commit -m "Initial commit: TempMail App"

# Crear repo en GitHub (via CLI)
gh repo create tempmail-app --public --source=. --remote=origin --push
```

### B. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa el repositorio de GitHub
4. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

5. Variables de entorno:
   - `NODE_ENV=production`

6. Deploy!

### C. Post-Despliegue

La app estará disponible en:
```
https://tempmail-app-xxx.vercel.app
```

**Nota:** Solo funcionará en modo demo (sin SMTP real)

## 🎯 Recomendación Final

### Para Demostración / Portfolio:
✅ **Usa Vercel** con modo simulación

### Para Uso Real:
✅ **Usa Railway o VPS** con configuración completa

## 🔗 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Configurar SMTP en VPS](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-postfix-on-ubuntu)
- [Upstash Redis](https://upstash.com)

## 📞 Soporte

Si necesitas ayuda para desplegar con servidor SMTP real, considera:
- Railway (más simple)
- DigitalOcean App Platform
- AWS Lightsail
- Heroku (con add-ons)
