# 📧 TempMail - Aplicación de Correo Electrónico Temporal

Aplicación completa de correo electrónico temporal con servidor SMTP propio, construida con Node.js y React.

![TempMail](https://img.shields.io/badge/TempMail-v1.0.0-teal)
![Node](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18-blue)

## 🌟 Características

- ✨ **Generación instantánea** de emails temporales
- 📬 **Servidor SMTP propio** para recibir correos reales
- 🔄 **Actualizaciones en tiempo real** con WebSocket
- 🎨 **Interfaz moderna** con React y TailwindCSS
- ⏰ **Auto-expiración** de emails (1 hora)
- 📱 **Notificaciones** de escritorio para nuevos correos
- 🗑️ **Gestión completa** de la bandeja de entrada
- 🔒 **Sin registro** ni datos personales requeridos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **smtp-server** - Servidor SMTP para recibir emails
- **mailparser** - Parser de emails
- **WebSocket (ws)** - Comunicación en tiempo real

### Frontend
- **React 18** - Librería UI
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

## 📦 Instalación

### Requisitos Previos
- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
```bash
cd C:\Users\angel\CascadeProjects\tempmail-app
```

2. **Instalar dependencias del backend**
```bash
npm install
```

3. **Instalar dependencias del frontend**
```bash
cd client
npm install
cd ..
```

O usar el script helper:
```bash
npm run install-all
```

## 🚀 Uso

### Modo Desarrollo

**Opción 1: Ejecutar todo con un comando**
```bash
npm run dev
```

Esto iniciará:
- Backend API en `http://localhost:3001`
- Servidor SMTP en puerto `2525`
- Frontend React en `http://localhost:3000`

**Opción 2: Ejecutar por separado**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run client
```

### Acceder a la Aplicación

1. Abre tu navegador en `http://localhost:3000`
2. Haz clic en "Generar Email"
3. Copia la dirección temporal generada
4. Úsala para registrarte en cualquier servicio
5. Los emails llegarán automáticamente a tu bandeja

## 📧 Enviar Emails de Prueba

### Método 1: Usando Telnet

```bash
telnet localhost 2525
EHLO localhost
MAIL FROM: test@example.com
RCPT TO: tu_email_temporal@tempmail.local
DATA
Subject: Prueba de Email
From: test@example.com
To: tu_email_temporal@tempmail.local

Este es un email de prueba!
.
QUIT
```

### Método 2: Usando un Cliente SMTP

Configura cualquier cliente de correo (Thunderbird, Outlook, etc.):
- **Servidor SMTP**: `localhost`
- **Puerto**: `2525`
- **Autenticación**: Ninguna
- **Seguridad**: Ninguna

### Método 3: Con Node.js

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2525,
  secure: false,
  tls: { rejectUnauthorized: false }
});

await transporter.sendMail({
  from: 'test@example.com',
  to: 'tu_email_temporal@tempmail.local',
  subject: 'Correo de Prueba',
  text: 'Hola desde Node.js!',
  html: '<h1>Hola desde Node.js!</h1>'
});
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz (ya incluido):

```env
PORT=3001              # Puerto del servidor API
SMTP_PORT=2525         # Puerto del servidor SMTP
APP_DOMAIN=tempmail.local  # Dominio de los emails
```

### Personalización

- **Tiempo de expiración**: Edita `emailLifetime` en `server/index.js` (por defecto: 1 hora)
- **Puerto frontend**: Modifica `server.port` en `client/vite.config.js`
- **Estilos**: Personaliza colores en `client/tailwind.config.js`

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend      │
│   React + Vite  │
│   Port: 3000    │
└────────┬────────┘
         │ HTTP/WS
         ↓
┌─────────────────┐
│   Backend API   │
│   Express       │
│   Port: 3001    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌─────────┐
│ SMTP   │ │ Memory  │
│ Server │ │ Store   │
│ 2525   │ │ (Map)   │
└────────┘ └─────────┘
```

### Flujo de Datos

1. Usuario genera email temporal
2. Backend crea registro en memoria
3. Frontend se suscribe vía WebSocket
4. Servidor SMTP recibe correos
5. Backend parsea y almacena
6. WebSocket notifica al frontend en tiempo real
7. Frontend actualiza UI automáticamente

## 📝 API Endpoints

### `POST /api/generate-email`
Genera un nuevo email temporal.

**Response:**
```json
{
  "email": "abc123@tempmail.local",
  "expiresIn": 3600000,
  "createdAt": 1234567890
}
```

### `GET /api/emails/:address`
Obtiene todos los emails de una dirección.

**Response:**
```json
{
  "emails": [
    {
      "id": "uuid",
      "from": "sender@example.com",
      "to": "abc123@tempmail.local",
      "subject": "Asunto",
      "text": "Contenido",
      "html": "<html>...</html>",
      "date": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "expiresAt": 1234567890
}
```

### `GET /api/emails/:address/:emailId`
Obtiene un email específico.

### `DELETE /api/emails/:address/:emailId`
Elimina un email.

### `GET /api/info`
Información del servidor.

### `GET /api/health`
Health check.

## 🔐 Seguridad y Producción

### Para Usar en Producción:

1. **Base de datos persistente**: Reemplaza Map por Redis
```bash
npm install redis
```

2. **Dominio real**: Configura DNS y certificados SSL
```bash
# Configurar MX records en tu DNS
mail.tudominio.com IN MX 10 tuservidor.com
```

3. **Autenticación SMTP** (opcional): Agrega autenticación al servidor SMTP

4. **Rate limiting**: Implementa límites de peticiones
```bash
npm install express-rate-limit
```

5. **Variables de entorno**: Usa `.env` seguro y no comitas secrets

6. **HTTPS**: Configura SSL/TLS para producción

7. **Firewall**: Abre solo los puertos necesarios

## 🐛 Troubleshooting

### El servidor SMTP no recibe correos
- Verifica que el puerto 2525 no esté en uso
- Comprueba el firewall de Windows
- Asegúrate que el dominio coincide con `APP_DOMAIN`

### WebSocket no conecta
- Verifica que el backend esté corriendo
- Comprueba la URL en `App.jsx` (debe ser `ws://localhost:3001`)
- Revisa la consola del navegador para errores

### Los emails no aparecen
- Verifica que el dominio del destinatario sea correcto
- Comprueba los logs del servidor
- Asegúrate que el email no haya expirado

## 📚 Recursos Adicionales

- [Documentación smtp-server](https://nodemailer.com/extras/smtp-server/)
- [RFC 5321 - SMTP Protocol](https://tools.ietf.org/html/rfc5321)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:
1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

ISC License

## 👨‍💻 Autor

Creado con ❤️ usando Cascade AI

---

## 🎯 Próximas Mejoras

- [ ] Persistencia con Redis
- [ ] Autenticación de usuarios (opcional)
- [ ] Filtros anti-spam
- [ ] Búsqueda de emails
- [ ] Exportar emails
- [ ] Extensión de Chrome
- [ ] Temas personalizables
- [ ] Multi-idioma
- [ ] API pública

## ⭐ ¿Te Gusta el Proyecto?

¡Dale una estrella! ⭐
