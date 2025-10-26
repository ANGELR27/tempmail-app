const axios = require('axios');

const RAILWAY_URL = 'https://fulfilling-cooperation-production.up.railway.app';

console.log('🔍 Verificando servidor de Railway...\n');

async function checkRailway() {
  try {
    console.log(`📡 Intentando conectar a: ${RAILWAY_URL}/api/health`);
    
    const startTime = Date.now();
    const response = await axios.get(`${RAILWAY_URL}/api/health`, {
      timeout: 30000 // 30 segundos
    });
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Servidor ACTIVO`);
    console.log(`   Estado: ${response.status} ${response.statusText}`);
    console.log(`   Tiempo de respuesta: ${responseTime}ms`);
    console.log(`   Respuesta:`, JSON.stringify(response.data, null, 2));
    
    // Verificar si el tiempo de respuesta es muy lento (indica "despertar" de sleep)
    if (responseTime > 10000) {
      console.log(`\n⚠️ ALERTA: Tiempo de respuesta MUY LENTO (${responseTime}ms)`);
      console.log(`   Esto indica que el servidor estaba "dormido" y se está despertando`);
      return 'SLEEPING';
    } else if (responseTime > 3000) {
      console.log(`\n⚠️ Tiempo de respuesta lento (${responseTime}ms)`);
      console.log(`   El servidor puede estar bajo carga o despertándose`);
      return 'SLOW';
    } else {
      console.log(`\n✅ Tiempo de respuesta normal`);
      return 'ACTIVE';
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log(`❌ TIMEOUT: El servidor no respondió en 30 segundos`);
      console.log(`   Causa probable: Servidor pausado/dormido por inactividad`);
      return 'TIMEOUT';
    } else if (error.code === 'ENOTFOUND') {
      console.log(`❌ Servidor NO ENCONTRADO`);
      console.log(`   El dominio no existe o el deployment fue eliminado`);
      return 'NOT_FOUND';
    } else if (error.response) {
      console.log(`❌ Error HTTP: ${error.response.status}`);
      console.log(`   El servidor respondió pero con error`);
      return 'ERROR';
    } else {
      console.log(`❌ Error de conexión: ${error.message}`);
      return 'CONNECTION_ERROR';
    }
  }
}

async function testMultipleTimes() {
  console.log('Realizando 2 pruebas para detectar patrón de "sleep"...\n');
  
  // Primera prueba
  console.log('━━━ PRUEBA 1 (inicial) ━━━');
  const result1 = await checkRailway();
  
  if (result1 === 'TIMEOUT' || result1 === 'NOT_FOUND' || result1 === 'CONNECTION_ERROR') {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNÓSTICO FINAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('❌ El servidor de Railway NO está disponible');
    console.log('\n🔍 POSIBLES CAUSAS:');
    console.log('   1. Railway pausó el servicio por inactividad (plan gratuito)');
    console.log('   2. Créditos de Railway agotados');
    console.log('   3. El deployment falló');
    console.log('   4. El proyecto fue eliminado');
    console.log('\n💡 SOLUCIONES:');
    console.log('   1. Ir a https://railway.app/dashboard');
    console.log('   2. Verificar el estado del proyecto');
    console.log('   3. Si está pausado, hacer click en "Resume"');
    console.log('   4. Si no hay créditos, agregar una tarjeta o esperar al siguiente ciclo');
    return;
  }
  
  // Esperar 2 segundos
  console.log('\n⏳ Esperando 2 segundos antes de la segunda prueba...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Segunda prueba
  console.log('\n━━━ PRUEBA 2 (verificación) ━━━');
  const result2 = await checkRailway();
  
  // Análisis final
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DIAGNÓSTICO FINAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (result1 === 'SLEEPING' || result1 === 'SLOW') {
    console.log('⚠️ PROBLEMA DETECTADO: Railway tiene AUTO-SLEEP activado');
    console.log('\n📝 EXPLICACIÓN:');
    console.log('   - El servidor se duerme después de ~15-30 min sin actividad');
    console.log('   - La primera petición después de dormir tarda 10-30 segundos');
    console.log('   - Esto causa que los usuarios vean errores o timeouts');
    console.log('\n💡 SOLUCIONES DISPONIBLES:');
    console.log('   ✅ 1. Implementar sistema de keep-alive (recomendado)');
    console.log('   ✅ 2. Usar cron job externo (cron-job.org, UptimeRobot)');
    console.log('   ⭐ 3. Upgrade a plan pagado de Railway ($5/mes - sin sleep)');
    console.log('\n¿Quieres que implemente la solución de keep-alive?');
  } else if (result1 === 'ACTIVE' && result2 === 'ACTIVE') {
    console.log('✅ SERVIDOR FUNCIONANDO CORRECTAMENTE');
    console.log('\n📝 ESTADO:');
    console.log('   - Railway está activo y responde rápido');
    console.log('   - No hay evidencia de auto-sleep');
    console.log('   - Los tiempos de respuesta son normales');
    console.log('\n💡 CONCLUSIÓN:');
    console.log('   Si los usuarios reportan que "no reciben emails después de un rato",');
    console.log('   el problema NO es auto-sleep del servidor.');
    console.log('\n   Posibles causas alternativas:');
    console.log('   - Tokens de Mail.tm expirando (ya solucionado con persistencia)');
    console.log('   - Problemas de red del usuario');
    console.log('   - Cache del navegador');
  }
}

testMultipleTimes().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
