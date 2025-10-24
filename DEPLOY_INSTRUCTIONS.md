# 🚀 Instrucciones de Despliegue a Vercel

## ⚡ Despliegue Rápido

### Opción 1: Desde la Interfaz Web de Vercel (MÁS FÁCIL)

1. **Sube el proyecto a GitHub:**

Ve a [github.com/new](https://github.com/new) y crea un nuevo repositorio llamado `tempmail-app`

```bash
# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/TU_USUARIO/tempmail-app.git
git push -u origin main
```

2. **Importa en Vercel:**

- Ve a [vercel.com/new](https://vercel.com/new)
- Click en "Import Project"
- Selecciona tu repositorio `tempmail-app`
- Configura:
  - **Framework Preset**: Vite
  - **Root Directory**: `./`
  - **Build Command**: `cd client && npm run build`
  - **Output Directory**: `client/dist`
  - **Install Command**: `npm install && cd client && npm install`

3. **Deploy!**
Click en "Deploy" y espera unos minutos.

---

### Opción 2: Desde CLI de Vercel

```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Login en Vercel
vercel login

# 3. Desplegar (te hará preguntas, responde así)
vercel

# Preguntas que te hará:
# ? Set up and deploy "C:\Users\angel\CascadeProjects\tempmail-app"? [Y/n] → Y
# ? Which scope do you want to deploy to? → Selecciona tu cuenta
# ? Link to existing project? [y/N] → N
# ? What's your project's name? → tempmail-app
# ? In which directory is your code located? → ./ (default)

# 4. Para desplegar a producción
vercel --prod
```

---

## 📝 Configuración Manual en Vercel Dashboard

Si Vercel no detecta automáticamente la configuración:

### Build Settings:
```
Framework Preset: Vite
Build Command: cd client && npm run build
Output Directory: client/dist
Install Command: npm install && cd client && npm install
Development Command: npm run dev
```

### Environment Variables:
```
NODE_ENV = production
```

### Root Directory:
```
./
```

---

## ⚠️ IMPORTANTE: Limitaciones en Vercel

Esta versión desplegada en Vercel es una **DEMO** porque:

❌ **No puede recibir emails SMTP reales** (Vercel no soporta servidores TCP persistentes)
❌ **No tiene WebSocket** en tiempo real
✅ **La interfaz funciona perfectamente**
✅ **Puedes simular la recepción de emails** para demostración

---

## 🧪 Probar la Aplicación Desplegada

Una vez desplegada en Vercel (ej: `https://tempmail-app.vercel.app`):

### 1. Genera un Email Temporal
Abre la app y genera un email: `abc123@tempmail.local`

### 2. Simula la Recepción de un Email

**Método 1: Con curl**
```bash
curl -X POST https://tempmail-app.vercel.app/api/simulate-email/abc123@tempmail.local \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"test@example.com\",\"subject\":\"Prueba\",\"text\":\"Hola mundo\"}"
```

**Método 2: Con PowerShell**
```powershell
$body = @{
    from = "test@example.com"
    subject = "Email de Prueba"
    text = "Este es un mensaje simulado"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tempmail-app.vercel.app/api/simulate-email/abc123@tempmail.local" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**Método 3: Con JavaScript (en la consola del navegador)**
```javascript
fetch('https://tempmail-app.vercel.app/api/simulate-email/abc123@tempmail.local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'demo@example.com',
    subject: 'Prueba desde JS',
    text: 'Este es un email simulado'
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 🔄 Actualizar el Despliegue

### Desde Git (Automático)
```bash
# Hacer cambios en el código
git add .
git commit -m "Actualización"
git push

# Vercel desplegará automáticamente
```

### Desde CLI
```bash
vercel --prod
```

---

## 🎯 URLs Importantes

Después del despliegue tendrás:

- **URL de Producción**: `https://tempmail-app-xxx.vercel.app`
- **Dashboard**: `https://vercel.com/tu-usuario/tempmail-app`
- **Analytics**: `https://vercel.com/tu-usuario/tempmail-app/analytics`
- **Logs**: `https://vercel.com/tu-usuario/tempmail-app/logs`

---

## 🔧 Solución de Problemas

### Error: "Build failed"
```bash
# Asegúrate de tener los package.json correctos
cd client
npm install
npm run build  # Debe crear client/dist/

# Si funciona localmente, funcionará en Vercel
```

### Error: "Cannot find module"
- Verifica que todas las dependencias estén en `package.json`
- No uses imports con rutas absolutas

### Error: "API routes not working"
- Asegúrate de que `api/index.js` exista
- Verifica que `vercel.json` esté configurado correctamente

---

## 🚀 Para Usar con Emails SMTP Reales

Si necesitas recepción REAL de emails, considera estas alternativas:

### Railway (Recomendado - $5/mes)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### DigitalOcean App Platform ($5/mes)
- Crea una cuenta en DigitalOcean
- Usa "App Platform"
- Conecta tu repositorio de GitHub
- Configura puertos y variables

### Render.com (Gratis con limitaciones)
- Soporta servidores persistentes
- Plan gratuito disponible

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más opciones.

---

## 📊 Monitoreo

Una vez desplegado, puedes ver:

- **Analytics**: Visitas, país de origen, dispositivos
- **Logs**: Errores y peticiones
- **Métricas**: Tiempo de carga, errores 4xx/5xx
- **Usage**: Consumo de bandwidth y funciones

---

## ✅ Checklist de Despliegue

- [ ] Código subido a GitHub
- [ ] Repositorio público o conectado a Vercel
- [ ] Build funciona localmente (`cd client && npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Proyecto importado en Vercel
- [ ] Despliegue completado
- [ ] URL de producción funciona
- [ ] Probado generación de email
- [ ] Probado simulación de recepción

---

## 🎉 ¡Listo!

Tu aplicación estará disponible en:
```
https://tempmail-app-[tu-hash].vercel.app
```

Puedes compartir esta URL para demostrar el proyecto. 🚀

---

**Necesitas ayuda?** Revisa:
- [Documentación de Vercel](https://vercel.com/docs)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa
- [README_VERCEL.md](./README_VERCEL.md) - Limitaciones y alternativas
