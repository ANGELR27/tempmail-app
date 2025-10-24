const axios = require('axios');

const MAILTM_API = 'https://api.mail.tm';

class MailTMService {
  constructor() {
    this.accounts = new Map(); // { email: { id, token, password } }
  }

  // Crear una cuenta temporal en Mail.tm
  async createAccount() {
    try {
      // 1. Obtener dominios disponibles
      const domainsRes = await axios.get(`${MAILTM_API}/domains`);
      const domain = domainsRes.data['hydra:member'][0].domain;
      
      // 2. Generar credenciales
      const username = Math.random().toString(36).substring(2, 10) + Math.floor(Math.random() * 1000);
      const email = `${username}@${domain}`;
      const password = Math.random().toString(36).substring(2, 15);
      
      // 3. Crear cuenta
      const accountRes = await axios.post(`${MAILTM_API}/accounts`, {
        address: email,
        password: password
      });
      
      // 4. Obtener token de autenticación
      const tokenRes = await axios.post(`${MAILTM_API}/token`, {
        address: email,
        password: password
      });
      
      const accountData = {
        id: accountRes.data.id,
        email: email,
        password: password,
        token: tokenRes.data.token,
        createdAt: Date.now()
      };
      
      this.accounts.set(email, accountData);
      
      console.log(`✨ Email temporal creado: ${email}`);
      
      return accountData;
    } catch (error) {
      console.error('Error creando cuenta Mail.tm:', error.response?.data || error.message);
      throw error;
    }
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
