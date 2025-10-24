const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      // Si no hay URL de Redis configurada, no intentar conectar
      if (!process.env.REDIS_URL) {
        console.log('⚠️  Redis no configurado, usando almacenamiento en memoria');
        return;
      }

      console.log('🔄 Conectando a Redis Cloud...');

      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          // Configuración para Redis Cloud
          tls: process.env.REDIS_URL.startsWith('rediss://'),
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              console.error('❌ Máximo de reintentos alcanzado');
              return new Error('Demasiados reintentos');
            }
            // Reintento exponencial: 50ms, 100ms, 200ms, 400ms, 800ms
            const delay = Math.min(retries * 50, 1000);
            console.log(`🔄 Reintentando conexión a Redis en ${delay}ms (intento ${retries})`);
            return delay;
          }
        },
        // Timeouts más largos para conexiones de red
        commandsQueueMaxLength: 1000,
        pingInterval: 10000 // Ping cada 10s para mantener conexión
      });

      this.client.on('error', (err) => {
        console.error('❌ Error de Redis:', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Conectando a Redis...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Cloud conectado y listo');
        this.connected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Reconectando a Redis...');
        this.reconnectAttempts++;
      });

      this.client.on('end', () => {
        console.log('🔌 Desconectado de Redis');
        this.connected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Error conectando a Redis:', error.message);
      this.connected = false;
    }
  }

  async get(key) {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error obteniendo de Redis:', error.message);
      return null;
    }
  }

  async set(key, value, expirationSeconds = null) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Error guardando en Redis:', error.message);
      return false;
    }
  }

  async delete(key) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Error eliminando de Redis:', error.message);
      return false;
    }
  }

  async keys(pattern) {
    if (!this.connected || !this.client) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error('Error obteniendo keys de Redis:', error.message);
      return [];
    }
  }

  async exists(key) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Error verificando existencia en Redis:', error.message);
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('👋 Desconectado de Redis correctamente');
      } catch (error) {
        console.error('Error desconectando de Redis:', error.message);
      }
      this.connected = false;
    }
  }
}

module.exports = new RedisClient();
