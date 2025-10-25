// Sistema de polling inteligente con backoff exponencial
// Evita rate limits y optimiza uso de recursos

class PollingManager {
  constructor() {
    this.intervals = new Map(); // { email: { interval, lastCheck, consecutiveEmpty } }
    this.minInterval = 5000;    // 5 segundos mínimo
    this.maxInterval = 60000;   // 60 segundos máximo
    this.backoffMultiplier = 1.5;
  }

  // Iniciar polling para un email
  startPolling(email, callback) {
    if (this.intervals.has(email)) {
      console.log(`⚠️ Polling ya activo para ${email}`);
      return;
    }

    const config = {
      interval: this.minInterval,
      lastCheck: Date.now(),
      consecutiveEmpty: 0,
      callback: callback
    };

    this.intervals.set(email, config);
    this._scheduleNext(email);
    
    console.log(`🔄 Polling iniciado para ${email} (intervalo: ${this.minInterval}ms)`);
  }

  // Detener polling
  stopPolling(email) {
    const config = this.intervals.get(email);
    if (config && config.timeoutId) {
      clearTimeout(config.timeoutId);
    }
    this.intervals.delete(email);
    console.log(`⏸️ Polling detenido para ${email}`);
  }

  // Notificar que se encontraron nuevos emails
  notifyNewEmails(email) {
    const config = this.intervals.get(email);
    if (config) {
      // Reset a intervalo mínimo cuando hay nuevos emails
      config.interval = this.minInterval;
      config.consecutiveEmpty = 0;
      console.log(`✉️ Nuevos emails detectados para ${email}, reseteando intervalo`);
    }
  }

  // Notificar que no hay nuevos emails
  notifyNoNewEmails(email) {
    const config = this.intervals.get(email);
    if (config) {
      config.consecutiveEmpty++;
      
      // Aumentar intervalo gradualmente (backoff exponencial)
      if (config.consecutiveEmpty > 2) {
        config.interval = Math.min(
          config.interval * this.backoffMultiplier,
          this.maxInterval
        );
        console.log(`⏳ Sin nuevos emails para ${email}, intervalo aumentado a ${Math.round(config.interval/1000)}s`);
      }
    }
  }

  // Programar siguiente check
  _scheduleNext(email) {
    const config = this.intervals.get(email);
    if (!config) return;

    config.timeoutId = setTimeout(async () => {
      config.lastCheck = Date.now();
      
      try {
        // Ejecutar callback
        const hasNewEmails = await config.callback();
        
        if (hasNewEmails) {
          this.notifyNewEmails(email);
        } else {
          this.notifyNoNewEmails(email);
        }
      } catch (error) {
        console.error(`Error en polling para ${email}:`, error.message);
      }

      // Programar siguiente check
      this._scheduleNext(email);
    }, config.interval);
  }

  // Obtener estadísticas
  getStats() {
    const stats = {};
    for (const [email, config] of this.intervals.entries()) {
      stats[email] = {
        interval: config.interval,
        lastCheck: config.lastCheck,
        consecutiveEmpty: config.consecutiveEmpty,
        nextCheck: config.lastCheck + config.interval
      };
    }
    return stats;
  }

  // Obtener emails activos
  getActiveEmails() {
    return Array.from(this.intervals.keys());
  }

  // Limpiar todos los pollings
  cleanup() {
    for (const email of this.intervals.keys()) {
      this.stopPolling(email);
    }
    console.log('🧹 Todos los pollings detenidos');
  }
}

module.exports = new PollingManager();
