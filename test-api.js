// Test completo de Mail.tm
// Node.js 22 tiene fetch nativo

async function testMailTM() {
  console.log('🧪 TEST COMPLETO DE MAIL.TM\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Verificar que Mail.tm API está disponible
    console.log('\n1️⃣ Verificando disponibilidad de Mail.tm...');
    try {
      const domainResponse = await fetch('https://api.mail.tm/domains');
      if (domainResponse.ok) {
        const domains = await domainResponse.json();
        console.log('✅ Mail.tm API está disponible');
        console.log('   Dominios:', domains['hydra:member']?.map(d => d.domain).join(', '));
      } else {
        console.error('❌ Mail.tm API no responde:', domainResponse.status);
        return;
      }
    } catch (error) {
      console.error('❌ No se puede conectar a Mail.tm:', error.message);
      return;
    }
    
    // Test 2: Generar email en nuestro servidor
    console.log('\n2️⃣ Generando email en nuestro servidor...');
    const genResponse = await fetch('http://localhost:3001/api/generate-email', {
      method: 'POST'
    });
    
    if (!genResponse.ok) {
      const error = await genResponse.text();
      console.error('❌ Error generando email:', genResponse.status);
      console.error(error);
      return;
    }
    
    const emailData = await genResponse.json();
    console.log('✅ Email generado:', emailData.email);
    console.log('   Provider:', emailData.provider);
    console.log('   Permanente:', emailData.permanent);
    console.log('   Created:', new Date(emailData.createdAt).toLocaleString());
    
    // Test 3: Verificar que podemos obtener mensajes
    console.log('\n3️⃣ Verificando acceso a mensajes...');
    const fetchResponse = await fetch(`http://localhost:3001/api/emails/${encodeURIComponent(emailData.email)}`);
    
    if (!fetchResponse.ok) {
      const error = await fetchResponse.text();
      console.error('❌ Error obteniendo emails:', fetchResponse.status);
      console.error(error);
      return;
    }
    
    const messagesData = await fetchResponse.json();
    console.log('✅ Acceso a bandeja de entrada OK');
    console.log('   Mensajes actuales:', messagesData.count);
    
    // Test 4: Instrucciones para enviar email de prueba
    console.log('\n4️⃣ PRÓXIMO PASO - Enviar email de prueba:');
    console.log('=' .repeat(50));
    console.log('\n📧 Dirección generada:', emailData.email);
    console.log('\n🎯 Para probar que llegan emails:');
    console.log('   1. Ve a TikTok/Instagram/Discord');
    console.log('   2. Usa este email:', emailData.email);
    console.log('   3. Solicita código de verificación');
    console.log('   4. Espera 30-60 segundos');
    console.log('   5. Refresca tu bandeja de entrada');
    console.log('\n⏳ Esperando 60 segundos para verificar si llegan mensajes...');
    
    // Esperar y verificar mensajes
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
      
      const checkResponse = await fetch(`http://localhost:3001/api/emails/${encodeURIComponent(emailData.email)}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.count > 0) {
          console.log(`\n✅ ¡EMAIL RECIBIDO! (${checkData.count} mensaje(s))`);
          console.log('\n📧 Primer mensaje:');
          const first = checkData.emails[0];
          console.log('   De:', first.from);
          console.log('   Asunto:', first.subject);
          console.log('   Fecha:', new Date(first.date).toLocaleString());
          return;
        } else {
          console.log(`   Esperando... (${(i + 1) * 10}s) - Sin mensajes aún`);
        }
      }
    }
    
    console.log('\n⚠️ No se recibieron mensajes en 60 segundos');
    console.log('   Esto es NORMAL si no enviaste ningún email de verificación');
    console.log('   Mail.tm está funcionando, solo espera recibir emails');
    
  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    console.error(error);
  }
}

testMailTM();
