# 🚀 DESPLEGAR A VERCEL - PASOS FINALES

## ⚠️ PROBLEMAS COMUNES

### ¿Error 502 en Railway?
Si tu deployment de Railway está dando error 502:
1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Revisa los logs del proyecto
3. Si está pausado, haz click en "Resume"
4. **Alternativa:** Despliega en Vercel (más estable para demos)

Ver **[DIAGNOSTICO_ERRORES.md](./DIAGNOSTICO_ERRORES.md)** para más detalles.

---

## ✅ Estado Actual

Tu proyecto está listo con:
- ✅ Git inicializado
- ✅ Archivos commiteados
- ✅ Código preparado para Vercel
- ✅ Documentación completa
- ✅ Errores de código corregidos (meta tags, manifest)

---

## 🎯 OPCIÓN 1: Desplegar con Vercel CLI (Más Rápido)

### Paso 1: Instalar Vercel CLI
```powershell
npm install -g vercel
```

### Paso 2: Login en Vercel
```powershell
vercel login
```
Se abrirá tu navegador para autenticarte.

### Paso 3: Desplegar
```powershell
cd C:\Users\angel\CascadeProjects\tempmail-app
vercel
```

Responde las preguntas:
- `? Set up and deploy?` → **Y**
- `? Which scope?` → Selecciona tu cuenta
- `? Link to existing project?` → **N**
- `? What's your project's name?` → **tempmail-app**
- `? In which directory is your code located?` → **./** (presiona Enter)

### Paso 4: Desplegar a Producción
```powershell
vercel --prod
```

---

## 🎯 OPCIÓN 2: Desplegar desde GitHub (Recomendado)

### Paso 1: Crear Repositorio en GitHub

**Opción A - Con GitHub CLI:**
```powershell
# Instalar GitHub CLI si no lo tienes
winget install GitHub.cli

# Login
gh auth login

# Crear y subir repo
gh repo create tempmail-app --public --source=. --remote=origin --push
```

**Opción B - Manualmente:**
1. Ve a https://github.com/new
2. Nombre: `tempmail-app`
3. Público o Privado (tu elección)
4. NO inicialices con README (ya tenemos archivos)
5. Click "Create repository"
6. Ejecuta estos comandos:

```powershell
git remote add origin https://github.com/TU_USUARIO/tempmail-app.git
git push -u origin main
```

### Paso 2: Conectar con Vercel

1. Ve a https://vercel.com/new
2. Click "Import Project"
3. Selecciona tu repositorio `tempmail-app`
4. Configura (Vercel debería detectar automáticamente):
   - **Framework**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

5. Click **"Deploy"**

### Paso 3: Esperar
El despliegue tomará 2-3 minutos. Verás el progreso en tiempo real.

---

## 🌐 Después del Despliegue

Tu app estará en una URL como:
```
https://tempmail-app-xxxxx.vercel.app
```

### Probar la App:

1. **Abre la URL** en tu navegador
2. **Click en "Generar Email"**
3. **Copia el email** generado (ej: `abc123@tempmail.local`)

### Simular Recepción de Email:

**Con PowerShell:**
```powershell
$url = "https://tu-app.vercel.app/api/simulate-email/abc123@tempmail.local"
$body = @{
    from = "demo@example.com"
    subject = "Prueba desde Vercel"
    text = "¡Funciona en producción!"
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
```

**Con curl:**
```bash
curl -X POST https://tu-app.vercel.app/api/simulate-email/abc123@tempmail.local \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Hola","text":"Mensaje de prueba"}'
```

---

## ⚙️ Configuración Adicional en Vercel

### Agregar Dominio Personalizado:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Agrega tu dominio (ej: `tempmail.tudominio.com`)

### Variables de Entorno:
1. Settings → Environment Variables
2. Agregar: `NODE_ENV = production`

### Configurar Git Auto-Deploy:
Ya está configurado automáticamente. Cada push a `main` desplegará automáticamente.

---

## 🔄 Actualizar el Proyecto

```powershell
# Hacer cambios en el código
git add .
git commit -m "Descripcion de cambios"
git push

# Vercel desplegará automáticamente
```

---

## 📊 Monitorear tu App

Dashboard de Vercel: https://vercel.com/dashboard

Ahí puedes ver:
- 📈 Analytics de visitas
- 📝 Logs en tiempo real
- ⚡ Métricas de rendimiento
- 🌍 Tráfico por país
- 📱 Dispositivos de usuarios

---

## ⚠️ RECORDATORIO: Limitaciones

Esta versión en Vercel es una **DEMOSTRACIÓN**:

- ❌ NO recibe emails SMTP reales (Vercel es serverless)
- ❌ NO tiene WebSocket persistente
- ✅ Interfaz completa funcional
- ✅ Simulación de recepción de emails

### Para Recepción REAL de Emails:

Necesitas desplegar en un servidor con soporte TCP:
- **Railway** ($5/mes) - Más fácil
- **DigitalOcean** ($6/mes)
- **AWS EC2** (variable)
- **Render.com** (gratis con límites)

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más opciones.

---

## 🎉 ¡Siguiente Paso!

Elige una opción y ejecuta los comandos. Tu app estará en línea en minutos.

**¿Prefieres CLI o GitHub?**
- **CLI**: Más rápido, 3 comandos
- **GitHub**: Mejor para colaboración y auto-deploy

---

## 🆘 Soporte

**Error en build?**
```powershell
# Probar build local primero
cd client
npm install
npm run build
```

**Error en deploy?**
- Revisa los logs en Vercel Dashboard
- Verifica que `client/dist/` se genera correctamente
- Asegúrate que `vercel.json` existe

**¿Necesitas ayuda?**
- [Documentación Vercel](https://vercel.com/docs)
- [Guía completa de despliegue](./DEPLOYMENT.md)
- [Limitaciones en Vercel](./README_VERCEL.md)
