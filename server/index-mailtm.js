const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const emailProvider = require('./email-provider'); // Gestor multi-provider
const redisClient = require('./redis-client');
const logoService = require('./logo-service');

// Configuración
const PORT = process.env.PORT || 3001;
// ⭐ EMAILS PERMANENTES - Sin expiración automática
const emailLifetime = null; // null = permanente, solo se eliminan manualmente

// Conectar a Redis
redisClient.connect();

// Configurar Express
const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente (para producción)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  
  // Log para debugging
  console.log('📁 Sirviendo archivos estáticos desde:', distPath);
  
  // Servir archivos de la carpeta assets con maxAge
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    }
  }));
  
  // Servir otros archivos estáticos del root
  app.use(express.static(distPath, {
    index: false, // No servir index.html automáticamente
    setHeaders: (res, filePath) => {
      // Configurar MIME types correctos
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
    }
  }));
}

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar WebSocket
const wss = new WebSocket.Server({ server });
const clients = new Map();

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
    for (const [email, wsSet] of clients.entries()) {
      wsSet.delete(ws);
      if (wsSet.size === 0) {
        clients.delete(email);
      }
    }
    console.log('🔌 Cliente WebSocket desconectado');
  });
});

// API Routes

// Generar nueva dirección de email temporal
app.post('/api/generate-email', async (req, res) => {
  try {
    // Obtener provider preferido de query params (opcional)
    const preferredProvider = req.query.provider || null;
    
    const accountData = await emailProvider.createAccount(preferredProvider);
    
    // Guardar en Redis SIN expiración (permanente)
    await redisClient.set(`account:${accountData.email}`, accountData);
    
    console.log(`✅ Email creado con provider: ${accountData.provider}`);
    
    res.json({
      email: accountData.email,
      expiresIn: null, // null = permanente
      createdAt: accountData.createdAt,
      provider: accountData.provider,
      permanent: true // Indicar que es permanente
    });
  } catch (error) {
    console.error('Error generando email:', error);
    res.status(500).json({ 
      error: 'Error generando email temporal',
      message: error.message 
    });
  }
});

// Obtener emails de una dirección
app.get('/api/emails/:address', async (req, res) => {
  try {
    const address = decodeURIComponent(req.params.address);
    
    // Obtener cuenta de Redis o memoria
    let account = await redisClient.get(`account:${address}`);
    if (!account) {
      // Intentar obtener de todos los providers
      account = emailProvider.getAccount(address, 'mail.tm') || 
                emailProvider.getAccount(address, 'mailsac');
    }
    
    if (!account) {
      return res.status(404).json({ error: 'Email no encontrado' });
    }
    
    const providerName = account.provider || 'mail.tm';
    
    // Restaurar en memoria si vino de Redis
    if (!emailProvider.getAccount(address, providerName)) {
      emailProvider.setAccount(address, account, providerName);
      console.log(`🔄 Cuenta restaurada en memoria desde Redis: ${address} (${providerName})`);
    }
    
    // Obtener mensajes del provider correcto (con re-autenticación automática si es necesario)
    const messages = await emailProvider.getMessages(address, providerName);
    
    // Actualizar en Redis si cambió (después de re-autenticación)
    const updatedAccount = emailProvider.getAccount(address, providerName);
    if (updatedAccount && JSON.stringify(updatedAccount) !== JSON.stringify(account)) {
      await redisClient.set(`account:${address}`, updatedAccount);
      console.log(`💾 Cuenta actualizada en Redis para: ${address}`);
    }
    
    // Transformar formato y enriquecer con logos
    const emails = await Promise.all(messages.map(async (msg) => {
      const brandInfo = await logoService.getBrandInfo(msg.from.address, msg.html);
      
      return {
        id: msg.id,
        from: msg.from.address,
        to: address,
        subject: msg.subject,
        intro: msg.intro,
        text: msg.text || msg.intro,
        html: msg.html || `<p>${msg.intro}</p>`,
        date: msg.createdAt,
        hasAttachments: msg.hasAttachments,
        seen: msg.seen,
        // Información de marca
        brandInfo: {
          logo: brandInfo.logo,
          companyName: brandInfo.companyName,
          domain: brandInfo.domain
        }
      };
    }));
    
    res.json({
      emails: emails.sort((a, b) => new Date(b.date) - new Date(a.date)),
      count: emails.length,
      expiresAt: null, // null = nunca expira
      permanent: true
    });
  } catch (error) {
    console.error('Error obteniendo emails:', error);
    res.status(500).json({ 
      error: 'Error obteniendo emails',
      message: error.message 
    });
  }
});

// Obtener un email específico
app.get('/api/emails/:address/:emailId', async (req, res) => {
  try {
    const address = decodeURIComponent(req.params.address);
    const emailId = req.params.emailId;
    
    const message = await mailTM.getMessage(address, emailId);
    
    const email = {
      id: message.id,
      from: message.from.address,
      to: address,
      subject: message.subject,
      text: message.text || message.intro,
      html: message.html || `<p>${message.intro}</p>`,
      date: message.createdAt,
      attachments: message.attachments || []
    };
    
    res.json(email);
  } catch (error) {
    console.error('Error obteniendo email:', error);
    res.status(404).json({ error: 'Mensaje no encontrado' });
  }
});

// Eliminar un email
app.delete('/api/emails/:address/:emailId', async (req, res) => {
  try {
    const address = decodeURIComponent(req.params.address);
    const emailId = req.params.emailId;
    
    await mailTM.deleteMessage(address, emailId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando email:', error);
    res.status(500).json({ error: 'Error eliminando mensaje' });
  }
});

// 🗑️ Eliminar cuenta de email (permanente - solo cuando el usuario lo decida)
app.delete('/api/account/:address', async (req, res) => {
  try {
    const address = decodeURIComponent(req.params.address);
    
    // Eliminar de Redis
    await redisClient.del(`account:${address}`);
    
    // Eliminar de memoria
    const account = mailTM.getAccount(address);
    if (account) {
      // Mail.tm no tiene API para eliminar cuentas, pero podemos eliminarla de nuestro sistema
      mailTM.accounts.delete(address);
      console.log(`🗑️ Cuenta eliminada del sistema: ${address}`);
    }
    
    res.json({ 
      success: true,
      message: 'Cuenta eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({ error: 'Error eliminando cuenta' });
  }
});

// Información del servidor
app.get('/api/info', (req, res) => {
  const providerStats = emailProvider.getStats();
  
  res.json({
    providers: providerStats.providers,
    bestProvider: providerStats.bestProvider,
    providerFailures: providerStats.failures,
    platform: process.env.RAILWAY_ENVIRONMENT ? 'railway' : 'local',
    emailLifetime: emailLifetime,
    redisConnected: redisClient.isConnected()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const providerStats = emailProvider.getStats();
  
  res.json({ 
    status: 'ok',
    providers: providerStats.providers,
    activeProvider: providerStats.bestProvider,
    redis: redisClient.isConnected()
  });
});

// Servir el frontend en producción (DEBE IR AL FINAL)
if (process.env.NODE_ENV === 'production') {
  // Solo enviar index.html para rutas que NO sean archivos estáticos
  app.get('*', (req, res, next) => {
    // Si la ruta incluye un punto (archivo estático), pasar al siguiente middleware
    if (req.path.includes('.')) {
      return next();
    }
    // Para rutas normales, enviar el index.html
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Iniciar servidor HTTP
server.listen(PORT, () => {
  console.log(`🚀 Servidor API escuchando en puerto ${PORT}`);
  console.log(`🌐 WebSocket disponible en ws://localhost:${PORT}`);
  console.log(`📧 Proveedor de email: Mail.tm`);
  console.log(`💾 Redis: ${redisClient.isConnected ? 'Conectado' : 'No disponible'}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Promesa rechazada no manejada:', error);
});
