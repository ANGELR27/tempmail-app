const axios = require('axios');

const MAILTM_API = 'https://api.mail.tm';

console.log('🔍 Verificando estado de Mail.tm API...\n');

async function testMailTmAPI() {
  try {
    // Test 1: Verificar dominios disponibles
    console.log('1️⃣ Verificando dominios disponibles...');
    const domainsRes = await axios.get(`${MAILTM_API}/domains`, {
      timeout: 10000
    });
    
    if (domainsRes.data && domainsRes.data['hydra:member']) {
      const domains = domainsRes.data['hydra:member'];
      console.log(`✅ Dominios disponibles: ${domains.length}`);
      domains.forEach(d => console.log(`   - ${d.domain}`));
      
      if (domains.length === 0) {
        console.log('❌ ERROR: No hay dominios disponibles en Mail.tm');
        return false;
      }
      
      const domain = domains[0].domain;
      console.log(`\n2️⃣ Intentando crear una cuenta de prueba con @${domain}...\n`);
      
      // Test 2: Crear cuenta de prueba
      const username = 'test' + Date.now();
      const email = `${username}@${domain}`;
      const password = Math.random().toString(36).substring(2, 15);
      
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
      
      const accountRes = await axios.post(`${MAILTM_API}/accounts`, {
        address: email,
        password: password
      }, {
        timeout: 10000
      });
      
      console.log(`✅ Cuenta creada exitosamente`);
      console.log(`   ID: ${accountRes.data.id}\n`);
      
      // Test 3: Obtener token
      console.log('3️⃣ Obteniendo token de autenticación...');
      const tokenRes = await axios.post(`${MAILTM_API}/token`, {
        address: email,
        password: password
      }, {
        timeout: 10000
      });
      
      console.log(`✅ Token obtenido exitosamente`);
      console.log(`   Token: ${tokenRes.data.token.substring(0, 20)}...\n`);
      
      // Test 4: Verificar acceso a mensajes
      console.log('4️⃣ Verificando acceso a mensajes...');
      const messagesRes = await axios.get(`${MAILTM_API}/messages`, {
        headers: {
          'Authorization': `Bearer ${tokenRes.data.token}`
        },
        timeout: 10000
      });
      
      console.log(`✅ Acceso a mensajes OK`);
      console.log(`   Mensajes en bandeja: ${messagesRes.data['hydra:member'].length}\n`);
      
      console.log('✅✅✅ TODAS LAS PRUEBAS PASARON ✅✅✅');
      console.log('\n📊 CONCLUSIÓN: Mail.tm está funcionando correctamente.');
      console.log('El problema podría estar en:');
      console.log('  • Tokens expirados en cuentas existentes');
      console.log('  • Pérdida de datos en memoria/Redis');
      console.log('  • Problemas de conectividad en el servidor de producción');
      
      return true;
    }
  } catch (error) {
    console.error('\n❌ ERROR en las pruebas:');
    
    if (error.code === 'ENOTFOUND') {
      console.error('❌ No se puede conectar a Mail.tm - Servidor no encontrado');
      console.error('   Posibles causas:');
      console.error('   • Mail.tm está caído');
      console.error('   • Problemas de DNS');
      console.error('   • Sin conexión a internet');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('❌ Timeout - Mail.tm no responde');
      console.error('   Posibles causas:');
      console.error('   • Mail.tm está experimentando lentitud');
      console.error('   • Firewall bloqueando la conexión');
    } else if (error.response) {
      console.error(`❌ Error HTTP: ${error.response.status}`);
      console.error(`   Mensaje: ${JSON.stringify(error.response.data)}`);
      
      if (error.response.status === 429) {
        console.error('   Causa: Rate limit excedido');
      } else if (error.response.status >= 500) {
        console.error('   Causa: Error del servidor Mail.tm');
      }
    } else {
      console.error(`❌ Error desconocido: ${error.message}`);
    }
    
    console.error('\n💡 RECOMENDACIONES:');
    console.error('  1. Verificar https://mail.tm en el navegador');
    console.error('  2. Revisar https://status.mail.tm (si existe)');
    console.error('  3. Considerar usar un proveedor alternativo (mailsac)');
    
    return false;
  }
}

// Ejecutar pruebas
testMailTmAPI().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
