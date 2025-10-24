// Utilidades para estadísticas

export function getStats() {
  const history = JSON.parse(localStorage.getItem('emailHistory') || '[]');
  const stats = JSON.parse(localStorage.getItem('emailStats') || '{}');
  
  return {
    emailsGenerated: history.length,
    messagesReceived: stats.totalMessages || 0,
    topServices: stats.services || {},
    averageTime: stats.averageTime || 0,
    lastUpdate: stats.lastUpdate || Date.now()
  };
}

export function updateStats(emailData) {
  const stats = JSON.parse(localStorage.getItem('emailStats') || '{}');
  
  // Incrementar contador de mensajes
  stats.totalMessages = (stats.totalMessages || 0) + 1;
  
  // Actualizar servicios
  if (!stats.services) stats.services = {};
  const service = emailData.service || 'Desconocido';
  stats.services[service] = (stats.services[service] || 0) + 1;
  
  // Calcular tiempo promedio
  if (emailData.receivedTime && emailData.emailCreatedTime) {
    const timeDiff = emailData.receivedTime - emailData.emailCreatedTime;
    const times = stats.times || [];
    times.push(timeDiff);
    stats.times = times.slice(-50); // Mantener últimos 50
    stats.averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  stats.lastUpdate = Date.now();
  
  localStorage.setItem('emailStats', JSON.stringify(stats));
  
  return stats;
}

export function getTopServices(limit = 5) {
  const stats = getStats();
  const services = stats.topServices;
  
  return Object.entries(services)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([service, count]) => ({ service, count }));
}

export function resetStats() {
  localStorage.removeItem('emailStats');
}

export function formatTime(ms) {
  if (!ms) return '0 seg';
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} seg`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds} seg`;
}
