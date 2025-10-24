// Extractor de códigos de verificación

export const CODE_PATTERNS = {
  // Códigos numéricos (4-8 dígitos)
  numeric: /\b\d{4,8}\b/g,
  
  // Códigos alfanuméricos
  alphanumeric: /\b[A-Z0-9]{4,8}\b/g,
  
  // Códigos con guiones
  withDashes: /\b[A-Z0-9]{2,4}-[A-Z0-9]{2,4}(?:-[A-Z0-9]{2,4})?\b/gi,
  
  // OTP común
  otp: /(?:código|code|OTP|verification code|código de verificación)[\s:]*([A-Z0-9]{4,8})/gi,
  
  // Patrones específicos de servicios
  tiktok: /(?:TikTok|tiktok).*?(\d{6})/i,
  instagram: /(?:Instagram|instagram).*?(\d{6})/i,
  facebook: /(?:Facebook|facebook).*?(\d{6})/i,
  discord: /(?:Discord|discord).*?([A-Z0-9]{4,8})/i,
};

export function extractCodes(text) {
  if (!text) return [];
  
  const codes = new Set();
  
  // Intentar con el patrón OTP primero (más específico)
  const otpMatches = text.matchAll(CODE_PATTERNS.otp);
  for (const match of otpMatches) {
    if (match[1]) {
      codes.add(match[1]);
    }
  }
  
  // Si no encontró códigos OTP, buscar patrones numéricos
  if (codes.size === 0) {
    const numericMatches = text.match(CODE_PATTERNS.numeric);
    if (numericMatches) {
      numericMatches.forEach(code => {
        // Filtrar números que probablemente no son códigos
        if (code.length >= 4 && code.length <= 8) {
          codes.add(code);
        }
      });
    }
  }
  
  // Buscar códigos con guiones
  const dashMatches = text.matchAll(CODE_PATTERNS.withDashes);
  for (const match of dashMatches) {
    codes.add(match[0]);
  }
  
  return Array.from(codes);
}

export function extractMainCode(text, subject = '') {
  const codes = extractCodes(text + ' ' + subject);
  
  // Si hay múltiples códigos, intentar determinar el principal
  if (codes.length > 1) {
    // Preferir códigos de 6 dígitos (más comunes en verificación)
    const sixDigit = codes.find(c => /^\d{6}$/.test(c));
    if (sixDigit) return sixDigit;
    
    // Preferir códigos mencionados cerca de palabras clave
    const keywords = ['código', 'code', 'verification', 'verificación', 'OTP'];
    for (const code of codes) {
      const index = text.toLowerCase().indexOf(code.toLowerCase());
      if (index !== -1) {
        const context = text.substring(Math.max(0, index - 50), index + 50).toLowerCase();
        if (keywords.some(kw => context.includes(kw))) {
          return code;
        }
      }
    }
  }
  
  return codes[0] || null;
}

export function detectServiceType(from, subject) {
  const combined = (from + ' ' + subject).toLowerCase();
  
  if (combined.includes('tiktok')) return { service: 'TikTok', icon: '🎵', type: 'Código de verificación' };
  if (combined.includes('instagram')) return { service: 'Instagram', icon: '📸', type: 'Código de verificación' };
  if (combined.includes('facebook') || combined.includes('meta')) return { service: 'Facebook', icon: '👥', type: 'Código de verificación' };
  if (combined.includes('discord')) return { service: 'Discord', icon: '🎮', type: 'Invitación' };
  if (combined.includes('twitter') || combined.includes('x.com')) return { service: 'Twitter', icon: '🐦', type: 'Verificación' };
  if (combined.includes('paypal')) return { service: 'PayPal', icon: '💰', type: 'Recibo' };
  if (combined.includes('netflix')) return { service: 'Netflix', icon: '🎬', type: 'Cuenta' };
  if (combined.includes('spotify')) return { service: 'Spotify', icon: '🎵', type: 'Cuenta' };
  if (combined.includes('github')) return { service: 'GitHub', icon: '💻', type: 'Verificación' };
  if (combined.includes('linkedin')) return { service: 'LinkedIn', icon: '💼', type: 'Invitación' };
  if (combined.includes('amazon')) return { service: 'Amazon', icon: '📦', type: 'Pedido' };
  if (combined.includes('google')) return { service: 'Google', icon: '🔍', type: 'Seguridad' };
  
  // Detectar por tipo de contenido
  if (combined.includes('welcome') || combined.includes('bienvenid')) return { service: 'Desconocido', icon: '👋', type: 'Bienvenida' };
  if (combined.includes('verify') || combined.includes('verificar')) return { service: 'Desconocido', icon: '✅', type: 'Verificación' };
  if (combined.includes('invoice') || combined.includes('factura')) return { service: 'Desconocido', icon: '📄', type: 'Factura' };
  if (combined.includes('receipt') || combined.includes('recibo')) return { service: 'Desconocido', icon: '🧾', type: 'Recibo' };
  
  return { service: 'Desconocido', icon: '📧', type: 'Mensaje' };
}
