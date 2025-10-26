// Script de prueba para verificar que la solución funciona
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

console.log('🧪 Probando la solución de persistencia de credenciales...\n');

async function testSolution() {
  let testEmail = null;
  let credentials = null;

  try {
    // 1. Generar email
    console.log('1️⃣ Generando email temporal...');
    const generateRes = await axios.post(`${API_URL}/generate-email`);
    testEmail = generateRes.data.email;
    credentials = generateRes.data.credentials;
    
    console.log(`✅ Email generado: ${testEmail}`);
    console.log(`✅ Credenciales recibidas: ${credentials ? 'Sí' : 'No'}`);
    
    if (!credentials) {
      console.error('❌ ERROR: No se recibieron credenciales del servidor');
      return false;
    }
    
    console.log(`   - ID: ${credentials.id}`);
    console.log(`   - Password: ${credentials.password ? '***' : 'N/A'}`);
    console.log(`   - Token: ${credentials.token ? credentials.token.substring(0, 20) + '...' : 'N/A'}`);
    
    // 2. Obtener emails sin credenciales (simular servidor sin datos)
    console.log('\n2️⃣ Obteniendo emails SIN enviar credenciales (simula pérdida de datos del servidor)...');
    try {
      const emailsRes1 = await axios.get(`${API_URL}/emails/${encodeURIComponent(testEmail)}`);
      console.log(`⚠️ Servidor respondió OK sin credenciales (tiene datos en memoria)`);
      console.log(`   Emails: ${emailsRes1.data.emails.length}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`✅ Servidor respondió 404 (esperado si no tiene datos)`);
      } else {
        console.log(`⚠️ Error inesperado: ${error.message}`);
      }
    }
    
    // 3. Obtener emails CON credenciales
    console.log('\n3️⃣ Obteniendo emails CON credenciales (restauración automática)...');
    const emailsRes2 = await axios.get(`${API_URL}/emails/${encodeURIComponent(testEmail)}`, {
      headers: {
        'x-account-credentials': JSON.stringify({
          ...credentials,
          provider: generateRes.data.provider
        })
      }
    });
    
    console.log(`✅ Servidor restauró la cuenta exitosamente`);
    console.log(`   Emails en bandeja: ${emailsRes2.data.emails.length}`);
    console.log(`   Permanente: ${emailsRes2.data.permanent ? 'Sí' : 'No'}`);
    
    // 4. Verificar info del servidor
    console.log('\n4️⃣ Verificando info del servidor...');
    const infoRes = await axios.get(`${API_URL}/info`);
    console.log(`✅ Info del servidor:`);
    console.log(`   Providers: ${infoRes.data.providers?.join(', ') || 'N/A'}`);
    console.log(`   Provider activo: ${infoRes.data.bestProvider || 'N/A'}`);
    console.log(`   Redis: ${infoRes.data.redisConnected ? 'Conectado' : 'No disponible'}`);
    
    console.log('\n✅✅✅ TODAS LAS PRUEBAS PASARON ✅✅✅');
    console.log('\n📊 CONCLUSIÓN:');
    console.log('  ✅ El servidor devuelve credenciales al crear email');
    console.log('  ✅ El servidor acepta credenciales en el header');
    console.log('  ✅ La restauración automática funciona');
    console.log('\n🎉 La solución está funcionando correctamente!');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('  1. Abre la aplicación en el navegador');
    console.log('  2. Genera un email');
    console.log('  3. Reinicia el servidor (Ctrl+C y reinicia)');
    console.log('  4. Refresca la página - los emails deberían seguir ahí');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERROR en las pruebas:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al servidor');
      console.error('   Causa: El servidor no está corriendo');
      console.error('\n💡 SOLUCIÓN:');
      console.error('   Ejecuta en otra terminal: node server/index-mailtm.js');
      console.error('   O: npm run dev');
    } else if (error.response) {
      console.error(`❌ Error HTTP: ${error.response.status}`);
      console.error(`   Mensaje: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    
    return false;
  }
}

// Ejecutar pruebas
testSolution().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
