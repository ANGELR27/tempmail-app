// Script para enviar email de prueba a una dirección generada
const nodemailer = require('nodemailer');

async function sendTestEmail(targetEmail) {
  console.log('📧 Enviando email de prueba a:', targetEmail);
  
  // Usar un servicio SMTP gratuito para pruebas
  // Ethereal Email (https://ethereal.email/) - SMTP de prueba
  const testAccount = await nodemailer.createTestAccount();
  
  const transporter = nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  const info = await transporter.sendMail({
    from: '"Test Bot" <test@example.com>',
    to: targetEmail,
    subject: '✅ Email de Prueba - Código: 123456',
    text: 'Tu código de verificación es: 123456',
    html: '<b>Tu código de verificación es:</b> <h1>123456</h1>',
  });
  
  console.log('✅ Email enviado:', info.messageId);
  console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('\n⚠️ NOTA: Ethereal es solo para testing');
  console.log('   Para emails REALES, usa TikTok/Instagram/Discord');
}

// Usar el email del argumento o uno por defecto
const email = process.argv[2] || 'test@tiffincrane.com';
sendTestEmail(email).catch(console.error);
