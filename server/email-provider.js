// Gestor de múltiples proveedores de email
const mailTM = require('./mailtm');
const mailsac = require('./mailsac');

class EmailProviderManager {
  constructor() {
    this.providers = {
      'mail.tm': mailTM,
      'mailsac': mailsac
    };
    
    // Provider por defecto
    this.defaultProvider = 'mail.tm';
    
    // Contador de fallos por provider
    this.failures = {
      'mail.tm': 0,
      'mailsac': 0
    };
    
    // Máximo de fallos antes de cambiar de provider
    this.maxFailures = 3;
    
    // Contador de uso para rotación equitativa
    this.usage = {
      'mail.tm': 0,
      'mailsac': 0
    };
    
    // Último provider usado para rotación round-robin
    this.lastUsedProvider = null;
    
    // Timestamp del último cambio de provider
    this.lastProviderChange = Date.now();
  }

  // Obtener el mejor provider disponible con rotación inteligente
  getBestProvider() {
    const providers = Object.keys(this.providers);
    
    // Filtrar providers con muchos fallos
    const availableProviders = providers.filter(
      p => this.failures[p] < this.maxFailures
    );
    
    // Si no hay providers disponibles, resetear contadores
    if (availableProviders.length === 0) {
      console.log('⚠️ Todos los providers tienen fallos, reseteando contadores');
      for (const p of providers) {
        this.failures[p] = 0;
      }
      return this.defaultProvider;
    }
    
    // Si solo hay un provider disponible, usarlo
    if (availableProviders.length === 1) {
      return availableProviders[0];
    }
    
    // Rotación cada 5 minutos para balancear carga
    const timeSinceChange = Date.now() - this.lastProviderChange;
    if (timeSinceChange > 300000) { // 5 minutos
      // Rotar al siguiente provider con menos uso
      const sortedByUsage = availableProviders.sort(
        (a, b) => this.usage[a] - this.usage[b]
      );
      const nextProvider = sortedByUsage[0];
      
      if (nextProvider !== this.lastUsedProvider) {
        this.lastProviderChange = Date.now();
        this.lastUsedProvider = nextProvider;
        console.log(`🔄 Rotando a provider: ${nextProvider} (uso: ${this.usage[nextProvider]})`);
        return nextProvider;
      }
    }
    
    // Usar provider con menos fallos
    const bestProvider = availableProviders.reduce((best, current) => {
      return this.failures[current] < this.failures[best] ? current : best;
    });
    
    return bestProvider;
  }

  // Crear cuenta con failover automático
  async createAccount(preferredProvider = null) {
    const providerName = preferredProvider || this.getBestProvider();
    const provider = this.providers[providerName];
    
    try {
      const account = await provider.createAccount();
      
      // Agregar metadata del provider
      account.provider = providerName;
      
      // Reset contador de fallos si funciona
      this.failures[providerName] = 0;
      
      return account;
    } catch (error) {
      console.error(`❌ Error en provider ${providerName}:`, error.message);
      
      // Incrementar contador de fallos
      this.failures[providerName]++;
      
      // Si falla, intentar con otro provider
      const alternativeProviders = Object.keys(this.providers).filter(p => p !== providerName);
      
      for (const altProvider of alternativeProviders) {
        try {
          console.log(`🔄 Intentando con provider alternativo: ${altProvider}`);
          const account = await this.providers[altProvider].createAccount();
          account.provider = altProvider;
          this.failures[altProvider] = 0;
          return account;
        } catch (altError) {
          console.error(`❌ Provider ${altProvider} también falló:`, altError.message);
          this.failures[altProvider]++;
        }
      }
      
      throw new Error('Todos los providers de email fallaron');
    }
  }

  // Obtener mensajes con el provider correcto
  async getMessages(email, providerName) {
    const provider = this.providers[providerName] || this.providers[this.defaultProvider];
    
    try {
      const messages = await provider.getMessages(email);
      this.failures[providerName] = 0;
      return messages;
    } catch (error) {
      console.error(`❌ Error obteniendo mensajes de ${providerName}:`, error.message);
      this.failures[providerName]++;
      return [];
    }
  }

  // Obtener mensaje específico
  async getMessage(email, messageId, providerName) {
    const provider = this.providers[providerName] || this.providers[this.defaultProvider];
    return await provider.getMessage(email, messageId);
  }

  // Eliminar mensaje
  async deleteMessage(email, messageId, providerName) {
    const provider = this.providers[providerName] || this.providers[this.defaultProvider];
    return await provider.deleteMessage(email, messageId);
  }

  // Obtener cuenta
  getAccount(email, providerName) {
    const provider = this.providers[providerName] || this.providers[this.defaultProvider];
    return provider.getAccount(email);
  }

  // Guardar cuenta
  setAccount(email, accountData, providerName) {
    const provider = this.providers[providerName] || this.providers[this.defaultProvider];
    return provider.setAccount(email, accountData);
  }

  // Estadísticas de providers
  getStats() {
    return {
      providers: Object.keys(this.providers),
      failures: this.failures,
      usage: this.usage,
      bestProvider: this.getBestProvider(),
      lastProviderChange: this.lastProviderChange,
      timeSinceChange: Date.now() - this.lastProviderChange
    };
  }
}

module.exports = new EmailProviderManager();
