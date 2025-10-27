// Rate Limiting Middleware - Protección contra abuso

const rateLimitStore = new Map();

function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minuto por defecto
    max = 30, // 30 peticiones por defecto
    message = 'Demasiadas peticiones, intenta más tarde',
    skipSuccessfulRequests = false
  } = options;
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Obtener o crear registro para esta IP
    let record = rateLimitStore.get(key);
    
    if (!record) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }
    
    // Resetear si pasó la ventana de tiempo
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    // Incrementar contador
    record.count++;
    
    // Verificar si excedió el límite
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      // Headers de rate limit para que el cliente sepa cuándo reintentar
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({ 
        error: 'Rate limit excedido',
        message,
        retryAfter,
        limit: max,
        window: `${windowMs / 1000}s`
      });
    }
    
    // Headers informativos para el cliente
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - record.count);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    // Si la petición fue exitosa y skipSuccessfulRequests está activo, decrementar
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (data) {
        if (res.statusCode < 400) {
          record.count--;
        }
        originalSend.call(this, data);
      };
    }
    
    next();
  };
}

// Limpieza periódica de registros viejos
setInterval(() => {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, record] of rateLimitStore.entries()) {
    // Eliminar registros que llevan más de 5 minutos inactivos
    if (now > record.resetTime + 300000) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`🧹 Limpieza de rate limiter: ${keysToDelete.length} IPs removidas`);
  }
}, 60000); // Cada minuto

// Rate limiters predefinidos para casos comunes
const rateLimiters = {
  // Muy estricto - para operaciones sensibles
  strict: rateLimit({ max: 5, windowMs: 60000 }),
  
  // Normal - para operaciones generales
  normal: rateLimit({ max: 30, windowMs: 60000 }),
  
  // Relajado - para lecturas
  relaxed: rateLimit({ max: 100, windowMs: 60000 }),
  
  // Creación de emails - muy controlado
  createEmail: rateLimit({ 
    max: 5, 
    windowMs: 300000, // 5 minutos
    message: 'Demasiadas cuentas creadas. Espera 5 minutos.'
  }),
  
  // Obtener emails - moderado
  getEmails: rateLimit({ 
    max: 60, 
    windowMs: 60000,
    message: 'Demasiadas peticiones de emails. Espera un momento.'
  })
};

module.exports = rateLimit;
module.exports.rateLimiters = rateLimiters;
module.exports.rateLimitStore = rateLimitStore; // Para testing
