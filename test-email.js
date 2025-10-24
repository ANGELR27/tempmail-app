/**
 * Script de prueba para enviar emails al servidor SMTP
 * 
 * Uso:
 * 1. Asegúrate que el servidor esté corriendo (npm run server)
 * 2. Genera un email en la app web (http://localhost:3000)
 * 3. Ejecuta: node test-email.js TU_EMAIL_TEMPORAL@tempmail.local
 */

const net = require('net');

// Obtener email del argumento o usar uno por defecto
const recipientEmail = process.argv[2] || 'test123@tempmail.local';
const SMTP_HOST = 'localhost';
const SMTP_PORT = 2525;

console.log('📧 Enviando email de prueba...');
console.log(`📬 Destinatario: ${recipientEmail}\n`);

const client = net.createConnection({ port: SMTP_PORT, host: SMTP_HOST }, () => {
  console.log('🔌 Conectado al servidor SMTP');
});

let step = 0;
const commands = [
  `EHLO localhost\r\n`,
  `MAIL FROM: <test@example.com>\r\n`,
  `RCPT TO: <${recipientEmail}>\r\n`,
  `DATA\r\n`,
  `Subject: Email de Prueba desde Node.js\r
From: Test Sender <test@example.com>\r
To: ${recipientEmail}\r
Content-Type: text/html; charset=utf-8\r
\r
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 30px; border-radius: 10px; }
      h1 { color: #14b8a6; }
      .info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>¡Email de Prueba Exitoso! 🎉</h1>
      <p>Este es un email de prueba enviado desde el script test-email.js</p>
      
      <div class="info">
        <h3>Detalles del Email:</h3>
        <ul>
          <li><strong>Enviado:</strong> ${new Date().toLocaleString('es-ES')}</li>
          <li><strong>Servidor:</strong> ${SMTP_HOST}:${SMTP_PORT}</li>
          <li><strong>Destinatario:</strong> ${recipientEmail}</li>
        </ul>
      </div>
      
      <p>Si puedes ver este mensaje, ¡tu servidor de correo temporal está funcionando correctamente! ✅</p>
      
      <div class="footer">
        <p>Enviado con ❤️ desde TempMail App</p>
      </div>
    </div>
  </body>
</html>\r
.\r\n`,
  `QUIT\r\n`
];

client.on('data', (data) => {
  const response = data.toString();
  console.log(`← ${response.trim()}`);
  
  if (step < commands.length) {
    const command = commands[step];
    console.log(`→ ${command.trim()}`);
    client.write(command);
    step++;
  } else {
    client.end();
  }
});

client.on('end', () => {
  console.log('\n✅ Email enviado exitosamente');
  console.log('🌐 Revisa la aplicación web para ver el mensaje');
});

client.on('error', (err) => {
  console.error('\n❌ Error al enviar email:', err.message);
  console.error('\n💡 Asegúrate que el servidor esté corriendo:');
  console.error('   npm run server');
});
