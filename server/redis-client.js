const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Usar REDIS_URL de Railway si existe, sino modo local (sin Redis)
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL
        });

        this.client.on('error', (err) => {
          console.error('Redis Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis conectado');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.log('⚠️  Redis no configurado, usando almacenamiento en memoria');
      }
    } catch (error) {
      console.error('Error conectando a Redis:', error);
      this.isConnected = false;
    }
  }

  async set(key, value, expirationSeconds = null) {
    if (!this.isConnected) return;
    
    try {
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, JSON.stringify(value));
      } else {
        await this.client.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error guardando en Redis:', error);
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error leyendo de Redis:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error eliminando de Redis:', error);
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Error verificando existencia en Redis:', error);
      return false;
    }
  }
}

module.exports = new RedisClient();
