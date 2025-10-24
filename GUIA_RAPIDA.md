# 🚀 Guía Rápida - TempMail

## Inicio Rápido (3 pasos)

### 1️⃣ Instalar Dependencias
```bash
cd C:\Users\angel\CascadeProjects\tempmail-app
npm run install-all
```

### 2️⃣ Iniciar Aplicación
```bash
npm run dev
```

### 3️⃣ Abrir en Navegador
```
http://localhost:3000
```

## ✅ Verificación Rápida

### Probar que funciona:

1. **Abre la app** → `http://localhost:3000`
2. **Genera un email** → Clic en "Generar Email"
3. **Copia el email** generado (ej: `abc123@tempmail.local`)

### Enviar Email de Prueba

**Con PowerShell:**
```powershell
$smtp = New-Object Net.Mail.SmtpClient("localhost", 2525)
$mensaje = New-Object Net.Mail.MailMessage
$mensaje.From = "test@example.com"
$mensaje.To.Add("TU_EMAIL_GENERADO@tempmail.local")
$mensaje.Subject = "Prueba"
$mensaje.Body = "¡Funciona!"
$smtp.Send($mensaje)
```

Reemplaza `TU_EMAIL_GENERADO` con el email que copiaste.

## 🎯 Comandos Útiles

```bash
# Iniciar todo (recomendado)
npm run dev

# Solo backend
npm run server

# Solo frontend
npm run client

# Construir para producción
npm run build
```

## 📍 URLs Importantes

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001/api
- **SMTP Server**: localhost:2525
- **WebSocket**: ws://localhost:3001

## 🔧 Solución de Problemas

### Error de puerto en uso
```bash
# PowerShell - Matar proceso en puerto 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# O cambiar el puerto en .env
PORT=3002
```

### No se instalan dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar
rm -rf node_modules
npm install
```

## 💡 Tips

- Los emails **expiran en 1 hora** automáticamente
- Las **notificaciones** del navegador muestran nuevos correos
- El **WebSocket** actualiza en tiempo real
- Puedes tener **múltiples emails** temporales a la vez

## 📧 Usar en tu App

### Ejemplo con Fetch API:

```javascript
// Generar email
const response = await fetch('http://localhost:3001/api/generate-email', {
  method: 'POST'
});
const { email } = await response.json();

// Obtener emails
const emails = await fetch(`http://localhost:3001/api/emails/${email}`);
const data = await emails.json();
console.log(data.emails);
```

### Ejemplo con axios:

```javascript
import axios from 'axios';

// Generar email
const { data } = await axios.post('http://localhost:3001/api/generate-email');
console.log(data.email);

// Obtener bandeja
const bandeja = await axios.get(`http://localhost:3001/api/emails/${data.email}`);
console.log(bandeja.data.emails);
```

## 🎨 Personalizar

### Cambiar colores:
Edita `client/tailwind.config.js`

### Cambiar tiempo de expiración:
Edita `server/index.js` → `emailLifetime`

### Cambiar dominio:
Edita `.env` → `APP_DOMAIN=tudominio.com`

---

¿Necesitas ayuda? Revisa el [README.md](./README.md) completo.
