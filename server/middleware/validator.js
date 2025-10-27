// Middleware de validación de inputs

function isValidEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) && email.length <= 254;
}

function isValidObjectId(id) {
  // Mail.tm usa IDs hexadecimales de 24 caracteres
  return /^[a-f0-9]{24}$/i.test(id);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remover caracteres peligrosos para XSS
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .substring(0, 1000); // Limitar longitud
}

// Middleware para validar parámetro de email
const validateEmailParam = (req, res, next) => {
  const email = decodeURIComponent(req.params.address);
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ 
      error: 'Email inválido',
      message: 'El formato del email no es válido'
    });
  }
  
  req.validatedEmail = email;
  next();
};

// Middleware para validar ID de email/mensaje
const validateEmailId = (req, res, next) => {
  const emailId = req.params.emailId;
  
  if (!emailId || !isValidObjectId(emailId)) {
    return res.status(400).json({ 
      error: 'ID de email inválido',
      message: 'El ID proporcionado no es válido'
    });
  }
  
  req.validatedEmailId = emailId;
  next();
};

// Middleware para validar body JSON
const validateJsonBody = (req, res, next) => {
  // Express ya parsea JSON, solo verificar que exista
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    
    if (contentType && !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type inválido',
        message: 'Se espera application/json'
      });
    }
  }
  
  next();
};

// Validar tamaño de petición
const validateRequestSize = (maxSize = 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Petición demasiado grande',
        message: `Tamaño máximo: ${maxSize} bytes`
      });
    }
    
    next();
  };
};

module.exports = {
  isValidEmail,
  isValidObjectId,
  sanitizeInput,
  validateEmailParam,
  validateEmailId,
  validateJsonBody,
  validateRequestSize
};
