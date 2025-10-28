const axios = require('axios');

const MAILTM_API = 'https://api.mail.tm';

class MailTMService {
  constructor() {
    this.accounts = new Map(); // { email: { id, token, password } }
  }

  // Crear una cuenta temporal en Mail.tm
  async createAccount() {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries} - Creando cuenta en Mail.tm...`);
        
        // 1. Obtener dominios disponibles
        const domainsRes = await axios.get(`${MAILTM_API}/domains`, {
          timeout: 10000,
          validateStatus: (status) => status === 200
        });
        
        if (!domainsRes.data || !domainsRes.data['hydra:member'] || domainsRes.data['hydra:member'].length === 0) {
          throw new Error('No se pudieron obtener dominios de Mail.tm');
        }
        
        const domain = domainsRes.data['hydra:member'][0].domain;
        console.log(`📧 Usando dominio: ${domain}`);
        
        // 2. Generar credenciales
        const username = Math.random().toString(36).substring(2, 10) + Math.floor(Math.random() * 1000);
        const email = `${username}@${domain}`;
        const password = Math.random().toString(36).substring(2, 15);
        
        // 3. Crear cuenta
        const accountRes = await axios.post(`${MAILTM_API}/accounts`, {
          address: email,
          password: password
        }, {
          timeout: 10000,
          validateStatus: (status) => status === 201
        });
        
        if (!accountRes.data || !accountRes.data.id) {
          throw new Error('La API no devolvió un ID de cuenta válido');
        }
        
        // 4. Obtener token de autenticación
        const tokenRes = await axios.post(`${MAILTM_API}/token`, {
          address: email,
          password: password
        }, {
          timeout: 10000,
          validateStatus: (status) => status === 200
        });
        
        if (!tokenRes.data || !tokenRes.data.token) {
          throw new Error('La API no devolvió un token válido');
        }
        
        const accountData = {
          id: accountRes.data.id,
          email: email,
          password: password,
          token: tokenRes.data.token,
          createdAt: Date.now()
        };
        
        this.accounts.set(email, accountData);
        
        console.log(`✅ Email temporal creado exitosamente: ${email}`);
        
        return accountData;
        
      } catch (error) {
        lastError = error;
        const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
        
        console.error(`❌ Intento ${attempt}/${maxRetries} falló:`, {
          message: errorMsg,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        // Si es el último intento, lanzar el error
        if (attempt === maxRetries) {
          break;
        }
        
        // Esperar antes de reintentar (backoff exponencial)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Esperando ${waitTime}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    const errorMessage = lastError?.response?.data?.message || lastError?.message || 'Error al crear cuenta en Mail.tm';
    console.error('❌ Todos los intentos fallaron. Último error:', errorMessage);
    throw new Error(`Mail.tm no disponible: ${errorMessage}`);
  }

  // Re-autenticar cuenta (cuando el token expira)
  async reAuthenticate(email) {
    try {
      const account = this.accounts.get(email);
      if (!account || !account.password) {
        throw new Error('No se puede re-autenticar: cuenta o contraseña no disponible');
      }
      
      console.log(`🔄 Re-autenticando cuenta: ${email}`);
      
      // Obtener nuevo token
      const tokenRes = await axios.post(`${MAILTM_API}/token`, {
        address: email,
        password: account.password
      });
      
      // Actualizar token
      account.token = tokenRes.data.token;
      this.accounts.set(email, account);
      
      console.log(`✅ Token renovado para: ${email}`);
      
      return account;
    } catch (error) {
      console.error('Error re-autenticando:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener mensajes de una cuenta
  async getMessages(email) {
    try {
      const account = this.accounts.get(email);
      if (!account) {
        throw new Error('Cuenta no encontrada');
      }
      
      try {
        const response = await axios.get(`${MAILTM_API}/messages`, {
          headers: {
            'Authorization': `Bearer ${account.token}`
          }
        });
        
        return response.data['hydra:member'] || [];
      } catch (error) {
        // Si el token expiró (401), intentar re-autenticar
        if (error.response?.status === 401) {
          console.log(`⚠️ Token expirado para ${email}, re-autenticando...`);
          await this.reAuthenticate(email);
          
          // Reintentar con nuevo token
          const retryResponse = await axios.get(`${MAILTM_API}/messages`, {
            headers: {
              'Authorization': `Bearer ${this.accounts.get(email).token}`
            }
          });
          
          return retryResponse.data['hydra:member'] || [];
        }
        throw error;
      }
    } catch (error) {
      console.error('Error obteniendo mensajes:', error.response?.data || error.message);
      return [];
    }
  }

  // Obtener un mensaje específico
  async getMessage(email, messageId) {
    try {
      const account = this.accounts.get(email);
      if (!account) {
        throw new Error('Cuenta no encontrada');
      }
      
      try {
        const response = await axios.get(`${MAILTM_API}/messages/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${account.token}`
          }
        });
        
        return response.data;
      } catch (error) {
        // Re-autenticar si el token expiró
        if (error.response?.status === 401) {
          await this.reAuthenticate(email);
          
          const retryResponse = await axios.get(`${MAILTM_API}/messages/${messageId}`, {
            headers: {
              'Authorization': `Bearer ${this.accounts.get(email).token}`
            }
          });
          
          return retryResponse.data;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error obteniendo mensaje:', error.response?.data || error.message);
      throw error;
    }
  }

  // Eliminar un mensaje
  async deleteMessage(email, messageId) {
    try {
      const account = this.accounts.get(email);
      if (!account) {
        throw new Error('Cuenta no encontrada');
      }
      
      try {
        await axios.delete(`${MAILTM_API}/messages/${messageId}`, {
          headers: {
            'Authorization': `Bearer ${account.token}`
          }
        });
        
        return true;
      } catch (error) {
        // Re-autenticar si el token expiró
        if (error.response?.status === 401) {
          await this.reAuthenticate(email);
          
          await axios.delete(`${MAILTM_API}/messages/${messageId}`, {
            headers: {
              'Authorization': `Bearer ${this.accounts.get(email).token}`
            }
          });
          
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error eliminando mensaje:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener cuenta
  getAccount(email) {
    return this.accounts.get(email);
  }

  // Guardar cuenta (para persistencia)
  setAccount(email, accountData) {
    this.accounts.set(email, accountData);
  }
}

module.exports = new MailTMService();
