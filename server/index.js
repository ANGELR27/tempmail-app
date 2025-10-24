const express = require('express');
const cors = require('cors');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración
const PORT = process.env.PORT || 3001;
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const APP_DOMAIN = process.env.APP_DOMAIN || process.env.RAILWAY_PUBLIC_DOMAIN || 'tempmail.local';

// Almacenamiento en memoria (en producción usar Redis)
const emailStore = new Map(); // { emailAddress: { emails: [], createdAt: Date } }
const emailLifetime = 60 * 60 * 1000; // 1 hora

// Limpiar emails expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of emailStore.entries()) {
    if (now - data.createdAt > emailLifetime) {
      emailStore.delete(address);
      console.log(`🗑️  Email ${address} expirado y eliminado`);
    }
  }
}, 5 * 60 * 1000);

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente (para producción)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar WebSocket
const wss = new WebSocket.Server({ server });
const clients = new Map(); // { emailAddress: Set<WebSocket> }

wss.on('connection', (ws) => {
  console.log('🔌 Cliente WebSocket conectado');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.email) {
        if (!clients.has(data.email)) {
          clients.set(data.email, new Set());
        }
        clients.get(data.email).add(ws);
        console.log(`📧 Cliente suscrito a: ${data.email}`);
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
    }
  });

  ws.on('close', () => {
    // Remover cliente de todas las suscripciones
    for (const [email, wsSet] of clients.entries()) {
      wsSet.delete(ws);
      if (wsSet.size === 0) {
        clients.delete(email);
      }
    }
    console.log('🔌 Cliente WebSocket desconectado');
  });
});

// Notificar a clientes suscritos
function notifyClients(emailAddress, newEmail) {
  if (clients.has(emailAddress)) {
    const message = JSON.stringify({
      type: 'new-email',
      email: newEmail
    });
    clients.get(emailAddress).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// Configurar servidor SMTP
const smtpServer = new SMTPServer({
  authOptional: true,
  disabledCommands: ['AUTH'],
  onData(stream, session, callback) {
    let emailData = '';
    
    stream.on('data', (chunk) => {
      emailData += chunk;
    });
    
    stream.on('end', async () => {
      try {
        const parsed = await simpleParser(emailData);
        const recipient = session.envelope.rcptTo[0].address;
        
        // Verificar que el dominio sea correcto
        if (!recipient.endsWith(`@${APP_DOMAIN}`)) {
          console.log(`❌ Email rechazado - dominio incorrecto: ${recipient}`);
          return callback(new Error('Domain not accepted'));
        }
        
        const email = {
          id: uuidv4(),
          from: parsed.from.text,
          to: recipient,
          subject: parsed.subject || '(Sin asunto)',
          text: parsed.text || '',
          html: parsed.html || '',
          date: new Date(),
          attachments: parsed.attachments || []
        };
        
        // Guardar email
        if (!emailStore.has(recipient)) {
          emailStore.set(recipient, {
            emails: [],
            createdAt: Date.now()
          });
        }
        
        emailStore.get(recipient).emails.push(email);
        console.log(`📬 Nuevo email recibido para: ${recipient}`);
        console.log(`   De: ${email.from}`);
        console.log(`   Asunto: ${email.subject}`);
        
        // Notificar a clientes conectados
        notifyClients(recipient, email);
        
        callback();
      } catch (error) {
        console.error('Error procesando email:', error);
        callback(error);
      }
    });
  }
});

smtpServer.listen(SMTP_PORT, () => {
  console.log(`📨 Servidor SMTP escuchando en puerto ${SMTP_PORT}`);
  console.log(`   Dominio: ${APP_DOMAIN}`);
});

// API Routes

// Generar nueva dirección de email temporal
app.post('/api/generate-email', (req, res) => {
  const username = Math.random().toString(36).substring(2, 10) + Math.floor(Math.random() * 1000);
  const email = `${username}@${APP_DOMAIN}`;
  
  emailStore.set(email, {
    emails: [],
    createdAt: Date.now()
  });
  
  console.log(`✨ Email temporal generado: ${email}`);
  
  res.json({
    email,
    expiresIn: emailLifetime,
    createdAt: Date.now()
  });
});

// Obtener emails de una dirección
app.get('/api/emails/:address', (req, res) => {
  const address = decodeURIComponent(req.params.address);
  const data = emailStore.get(address);
  
  if (!data) {
    return res.status(404).json({ error: 'Email no encontrado' });
  }
  
  res.json({
    emails: data.emails.sort((a, b) => b.date - a.date),
    count: data.emails.length,
    expiresAt: data.createdAt + emailLifetime
  });
});

// Obtener un email específico
app.get('/api/emails/:address/:emailId', (req, res) => {
  const address = decodeURIComponent(req.params.address);
  const emailId = req.params.emailId;
  const data = emailStore.get(address);
  
  if (!data) {
    return res.status(404).json({ error: 'Email no encontrado' });
  }
  
  const email = data.emails.find(e => e.id === emailId);
  
  if (!email) {
    return res.status(404).json({ error: 'Mensaje no encontrado' });
  }
  
  res.json(email);
});

// Eliminar un email
app.delete('/api/emails/:address/:emailId', (req, res) => {
  const address = decodeURIComponent(req.params.address);
  const emailId = req.params.emailId;
  const data = emailStore.get(address);
  
  if (!data) {
    return res.status(404).json({ error: 'Email no encontrado' });
  }
  
  data.emails = data.emails.filter(e => e.id !== emailId);
  res.json({ success: true });
});

// Información del servidor
app.get('/api/info', (req, res) => {
  res.json({
    domain: APP_DOMAIN,
    smtpPort: SMTP_PORT,
    activeEmails: emailStore.size,
    emailLifetime: emailLifetime
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir el frontend en producción (debe ir después de las rutas API)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Iniciar servidor HTTP
server.listen(PORT, () => {
  console.log(`🚀 Servidor API escuchando en puerto ${PORT}`);
  console.log(`🌐 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`\n📝 Para probar el servidor SMTP:`);
  console.log(`   telnet localhost ${SMTP_PORT}`);
  console.log(`\n🔧 Configuración de cliente de correo:`);
  console.log(`   Servidor SMTP: localhost:${SMTP_PORT}`);
  console.log(`   No requiere autenticación`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Promesa rechazada no manejada:', error);
});
