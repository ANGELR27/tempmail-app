const axios = require('axios');

// Mailsac - Servicio alternativo de email temporal
// Docs: https://docs.mailsac.com/
const MAILSAC_API = 'https://mailsac.com/api';

class MailsacService {
  constructor() {
    this.accounts = new Map(); // { email: { address, createdAt } }
    this.apiKey = process.env.MAILSAC_API_KEY; // Opcional - más límites sin API key
  }

  // Generar email temporal con Mailsac
  async createAccount() {
    try {
      // Mailsac genera emails automáticamente con el formato: random@mailsac.com
      // Podemos usar cualquier dirección @mailsac.com sin registrarla
      const username = Math.random().toString(36).substring(2, 12);
      const email = `${username}@mailsac.com`;
      
      const accountData = {
        email: email,
        address: email,
        createdAt: Date.now(),
        provider: 'mailsac'
      };
      
      this.accounts.set(email, accountData);
      
      console.log(`✨ Email Mailsac creado: ${email}`);
      
      return accountData;
    } catch (error) {
      console.error('Error creando cuenta Mailsac:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener mensajes de Mailsac
  async getMessages(email) {
    try {
      const address = email.split('@')[0]; // Mailsac usa solo el username
      
      const headers = {};
      if (this.apiKey) {
        headers['Mailsac-Key'] = this.apiKey;
      }
      
      const response = await axios.get(`${MAILSAC_API}/addresses/${address}/messages`, {
        headers
      });
      
      // Transformar formato de Mailsac a formato compatible con Mail.tm
      const messages = (response.data || []).map(msg => ({
        id: msg._id,
        from: { address: msg.from[0]?.address || 'unknown@mailsac.com' },
        to: [{ address: email }],
        subject: msg.subject || '(Sin asunto)',
        intro: msg.subject || '',
        text: '', // Mailsac requiere petición adicional para el texto completo
        html: '',
        createdAt: msg.received || new Date().toISOString(),
        hasAttachments: msg.attachments > 0
      }));
      
      return messages;
    } catch (error) {
      // Si no hay mensajes, Mailsac devuelve 404, lo cual es normal
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error obteniendo mensajes Mailsac:', error.response?.data || error.message);
      return [];
    }
  }

  // Obtener un mensaje específico
  async getMessage(email, messageId) {
    try {
      const address = email.split('@')[0];
      
      const headers = {};
      if (this.apiKey) {
        headers['Mailsac-Key'] = this.apiKey;
      }
      
      const response = await axios.get(`${MAILSAC_API}/addresses/${address}/messages/${messageId}`, {
        headers
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mensaje Mailsac:', error.response?.data || error.message);
      throw error;
    }
  }

  // Eliminar un mensaje
  async deleteMessage(email, messageId) {
    try {
      const address = email.split('@')[0];
      
      const headers = {};
      if (this.apiKey) {
        headers['Mailsac-Key'] = this.apiKey;
      }
      
      await axios.delete(`${MAILSAC_API}/addresses/${address}/messages/${messageId}`, {
        headers
      });
      
      return true;
    } catch (error) {
      console.error('Error eliminando mensaje Mailsac:', error.response?.data || error.message);
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

module.exports = new MailsacService();
