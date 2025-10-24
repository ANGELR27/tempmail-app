// API Serverless para Vercel
// Nota: El servidor SMTP no puede correr en Vercel (serverless)
// Esta versión usa almacenamiento en memoria temporal

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

// Almacenamiento temporal en memoria
// NOTA: En Vercel esto se resetea en cada invocación
// Para producción, usa Redis, Upstash, o similar
const emailStore = new Map();
const emailLifetime = 60 * 60 * 1000; // 1 hora

// Limpiar emails expirados
function cleanExpired() {
  const now = Date.now();
  for (const [address, data] of emailStore.entries()) {
    if (now - data.createdAt > emailLifetime) {
      emailStore.delete(address);
    }
  }
}

// Generar nueva dirección de email temporal
app.post('/api/generate-email', (req, res) => {
  cleanExpired();
  
  const username = Math.random().toString(36).substring(2, 10) + Math.floor(Math.random() * 1000);
  const email = `${username}@tempmail.local`;
  
  emailStore.set(email, {
    emails: [],
    createdAt: Date.now()
  });
  
  res.json({
    email,
    expiresIn: emailLifetime,
    createdAt: Date.now(),
    note: 'DEMO MODE - En Vercel no se pueden recibir emails reales. Usa el endpoint /api/simulate-email para simular recepción.'
  });
});

// Simular recepción de email (para demo en Vercel)
app.post('/api/simulate-email/:address', (req, res) => {
  const address = decodeURIComponent(req.params.address);
  const { from, subject, text } = req.body;
  
  const data = emailStore.get(address);
  
  if (!data) {
    return res.status(404).json({ error: 'Email no encontrado' });
  }
  
  const email = {
    id: uuidv4(),
    from: from || 'demo@example.com',
    to: address,
    subject: subject || 'Email de Demostración',
    text: text || 'Este es un email de demostración. En producción, necesitarás un servidor SMTP real.',
    html: `<p>${text || 'Este es un email de demostración.'}</p>`,
    date: new Date(),
    attachments: []
  };
  
  data.emails.push(email);
  
  res.json({
    success: true,
    email
  });
});

// Obtener emails de una dirección
app.get('/api/emails/:address', (req, res) => {
  cleanExpired();
  
  const address = decodeURIComponent(req.params.address);
  const data = emailStore.get(address);
  
  if (!data) {
    return res.status(404).json({ error: 'Email no encontrado' });
  }
  
  res.json({
    emails: data.emails.sort((a, b) => new Date(b.date) - new Date(a.date)),
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
  cleanExpired();
  
  res.json({
    domain: 'tempmail.local',
    mode: 'serverless',
    platform: 'vercel',
    activeEmails: emailStore.size,
    emailLifetime: emailLifetime,
    note: 'DEMO MODE - El servidor SMTP real requiere un VPS. Esta versión usa simulación.'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API escuchando en puerto ${PORT}`);
  });
}

// Export para Vercel
module.exports = app;
