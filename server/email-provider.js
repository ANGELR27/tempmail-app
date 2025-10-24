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
  }

  // Obtener el mejor provider disponible
  getBestProvider() {
    // Si el default tiene pocos fallos, usarlo
    if (this.failures[this.defaultProvider] < this.maxFailures) {
      return this.defaultProvider;
    }
    
    // Buscar provider con menos fallos
    let bestProvider = this.defaultProvider;
    let minFailures = this.failures[this.defaultProvider];
    
    for (const [name, count] of Object.entries(this.failures)) {
      if (count < minFailures) {
        minFailures = count;
        bestProvider = name;
      }
    }
    
    console.log(`🔄 Usando provider: ${bestProvider} (fallos: ${minFailures})`);
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
      bestProvider: this.getBestProvider()
    };
  }
}

module.exports = new EmailProviderManager();
