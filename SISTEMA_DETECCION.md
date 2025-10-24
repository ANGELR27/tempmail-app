# 🔍 Sistema de Detección y Corrección de Errores

## 🎯 Descripción

Sistema automatizado para detectar, validar y corregir errores comunes en la aplicación TempMail.

---

## 📦 Scripts Disponibles

### 1. **Validar Proyecto** ✅
Detecta errores en HTML, manifest, Service Worker y archivos estáticos.

```powershell
npm run validate
```

**Detecta:**
- ✓ Meta tags obsoletos
- ✓ Archivos faltantes
- ✓ Errores en manifest.json
- ✓ Problemas en Service Worker
- ✓ Referencias a recursos inexistentes

**Ejemplo de salida:**
```
🔍 Iniciando validación completa...

✅ Validación de HTML completada
✅ Validación de manifest completada
✅ Validación de archivos estáticos completada
✅ Validación de Service Worker completada

======================================================================
📊 REPORTE DE VALIDACIÓN
======================================================================

❌ ERRORES CRÍTICOS:

1. [deprecated_meta_tag] Meta tag "apple-mobile-web-app-capable" está obsoleto
   💡 Solución: Usar "mobile-web-app-capable" en su lugar
   📁 Archivo: c:\...\client\index.html
```

---

### 2. **Corregir Automáticamente** 🔧
Aplica correcciones automáticas a problemas comunes.

```powershell
npm run fix
```

**Corrige:**
- ✓ Meta tags obsoletos → Actualiza a versión moderna
- ✓ Iconos inexistentes → Remueve del manifest
- ✓ .gitignore faltante → Crea uno completo
- ✓ Service Worker → Verifica mejores prácticas

**Ejemplo de salida:**
```
🔧 Iniciando corrección automática...

✅ index.html corregido
✅ manifest.json corregido
ℹ️  Service Worker verificado
✅ .gitignore creado

======================================================================
🔧 REPORTE DE CORRECCIONES
======================================================================

✅ Correcciones aplicadas:

1. Meta tag obsoleto corregido en index.html
2. Iconos inexistentes removidos de manifest.json
3. .gitignore creado

📝 SIGUIENTE PASO:
   Commitear y redesplegar:

   git add .
   git commit -m "Auto-fix: correcciones automáticas"
   git push
```

---

### 3. **Verificar Deployment** 🌐
Compara código local vs producción en Railway.

```powershell
npm run check-deploy
```

O con URL personalizada:
```powershell
npm run check-deploy https://tu-app.railway.app
```

**Verifica:**
- ✓ Estado del servidor (200, 502, 404, etc)
- ✓ Meta tags en HTML de producción
- ✓ Assets disponibles (manifest, SVG, SW)
- ✓ MIME types correctos
- ✓ Sincronización con código local

**Ejemplo de salida:**
```
🔍 Verificando deployment en Railway...

URL: https://fulfilling-cooperation-production.up.railway.app

🔍 Verificando estado del servidor...
❌ Servidor devuelve error 502/503 (Bad Gateway/Service Unavailable)

======================================================================
📊 REPORTE DE DEPLOYMENT
======================================================================

URL: https://fulfilling-cooperation-production.up.railway.app

🚨 CRÍTICO:

❌ Servidor devuelve error 502/503 (Bad Gateway/Service Unavailable)

ℹ️  INFORMACIÓN:

   El deployment está caído o fallando

📝 PASOS SUGERIDOS:

1. Verificar en Railway Dashboard: https://railway.app/dashboard
2. Ver logs: railway logs
3. Redesplegar: railway up
4. O migrar a Vercel: vercel --prod
```

---

### 4. **Pre-Deploy Check** 🚀
Ejecuta corrección + validación antes de desplegar.

```powershell
npm run pre-deploy
```

Equivale a:
```powershell
npm run fix && npm run validate
```

---

## 🔄 Flujo de Trabajo Recomendado

### Antes de Commitear:
```powershell
# 1. Corregir errores automáticamente
npm run fix

# 2. Validar todo
npm run validate

# 3. Si todo OK, commitear
git add .
git commit -m "feat: nuevas funcionalidades"
git push
```

### Después de Desplegar:
```powershell
# Esperar 2-3 minutos y verificar
npm run check-deploy

# Si hay errores, revisar logs de Railway
railway logs
```

### Si Railway Tiene Problemas:
```powershell
# 1. Ver diagnóstico completo
npm run check-deploy

# 2. Ver logs en Railway
railway logs

# 3. Redesplegar si es necesario
railway up

# 4. Verificar de nuevo
npm run check-deploy
```

---

## 📁 Archivos del Sistema

```
scripts/
├── validate-html.js       # Validador completo
├── auto-fix.js            # Corrector automático
└── check-deployment.js    # Verificador de deployment
```

---

## 🐛 Errores Comunes Detectados

### Error 1: Meta Tag Obsoleto
**Detección:**
```
[deprecated_meta_tag] Meta tag "apple-mobile-web-app-capable" está obsoleto
```

**Corrección Automática:**
```
<meta name="apple-mobile-web-app-capable" content="yes">
↓
<meta name="mobile-web-app-capable" content="yes">
```

---

### Error 2: Iconos Faltantes en Manifest
**Detección:**
```
[missing_file] Icono /icon-192.png no existe
```

**Corrección Automática:**
Remueve la referencia del manifest.json

---

### Error 3: Deployment Desincronizado
**Detección:**
```
❌ CÓDIGO DESINCRONIZADO
   Local: Meta tag actualizado ✅
   Railway: Meta tag obsoleto ❌
```

**Solución:**
```powershell
git push
railway up
```

---

### Error 4: Servidor 502
**Detección:**
```
❌ Servidor devuelve error 502/503 (Bad Gateway)
```

**Solución:**
1. Ir a Railway Dashboard
2. Ver logs: `railway logs`
3. Si está pausado: Resume
4. Si falló build: Redesplegar

---

## 💡 Tips

### Integración con Git Hooks
Puedes hacer que la validación se ejecute automáticamente:

Crear `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run validate
```

Hacer ejecutable (Linux/Mac):
```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD
Agregar a tu pipeline (GitHub Actions, etc):
```yaml
- name: Validate
  run: npm run validate

- name: Auto-fix if needed
  run: npm run fix
```

---

## 🆘 Troubleshooting

### "Cannot find module"
```powershell
# Reinstalar dependencias
npm install
```

### "Permission denied"
```powershell
# Windows: Ejecutar como administrador
# Linux/Mac: chmod +x scripts/*.js
```

### Scripts no detectan archivos
```powershell
# Verificar que estás en el directorio raíz del proyecto
cd c:\Users\angel\CascadeProjects\tempmail-app
npm run validate
```

---

## 📊 Resumen de Comandos

| Comando | Función | Cuándo usar |
|---------|---------|-------------|
| `npm run validate` | Detectar errores | Antes de commit |
| `npm run fix` | Corregir automáticamente | Cuando hay errores |
| `npm run check-deploy` | Verificar producción | Después de deploy |
| `npm run pre-deploy` | Fix + Validate | Antes de deploy |

---

**✨ Consejo:** Ejecuta `npm run pre-deploy` antes de cada deployment para asegurar que todo esté correcto.
