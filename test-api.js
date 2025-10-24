// Test rápido de la API
// Node.js 22 tiene fetch nativo

async function testAPI() {
  console.log('🧪 Probando generación de email...');
  
  try {
    // Test 1: Generate Email
    const genResponse = await fetch('http://localhost:3001/api/generate-email', {
      method: 'POST'
    });
    
    if (!genResponse.ok) {
      console.error('❌ Error generando email:', genResponse.status);
      const error = await genResponse.text();
      console.error(error);
      return;
    }
    
    const emailData = await genResponse.json();
    console.log('✅ Email generado:', emailData.email);
    console.log('   Provider:', emailData.provider);
    console.log('   Permanente:', emailData.permanent);
    
    // Test 2: Fetch Emails
    console.log('\n🧪 Probando obtención de mensajes...');
    const fetchResponse = await fetch(`http://localhost:3001/api/emails/${encodeURIComponent(emailData.email)}`);
    
    if (!fetchResponse.ok) {
      console.error('❌ Error obteniendo emails:', fetchResponse.status);
      const error = await fetchResponse.text();
      console.error(error);
      return;
    }
    
    const messagesData = await fetchResponse.json();
    console.log('✅ Mensajes obtenidos:', messagesData.count);
    console.log('   Emails:', messagesData.emails?.length || 0);
    
    if (messagesData.emails && messagesData.emails.length > 0) {
      console.log('\n📧 Primer mensaje:');
      const first = messagesData.emails[0];
      console.log('   De:', first.from);
      console.log('   Asunto:', first.subject);
      console.log('   Fecha:', first.date);
    } else {
      console.log('   ℹ️  No hay mensajes aún (esto es normal para un email nuevo)');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error(error);
  }
}

testAPI();
