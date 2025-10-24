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
  if (!text && !subject) return null;
  
  const fullText = (text || '') + ' ' + (subject || '');
  
  // Primero buscar patrones específicos de servicios comunes
  // TikTok: generalmente envía códigos de 6 dígitos
  const tiktokMatch = fullText.match(/(?:TikTok|tiktok|verificación|verification).*?(\d{6})/i);
  if (tiktokMatch && tiktokMatch[1]) {
    return tiktokMatch[1];
  }
  
  // Buscar código de verificación explícito
  const verificationMatch = fullText.match(/(?:código|code|OTP|verification code|código de verificación)[\s:]*([A-Z0-9]{4,8})/i);
  if (verificationMatch && verificationMatch[1]) {
    return verificationMatch[1];
  }
  
  const codes = extractCodes(fullText);
  
  // Si hay múltiples códigos, intentar determinar el principal
  if (codes.length > 1) {
    // Preferir códigos de 6 dígitos (más comunes en verificación)
    const sixDigit = codes.find(c => /^\d{6}$/.test(c));
    if (sixDigit) return sixDigit;
    
    // Preferir códigos de 5 dígitos
    const fiveDigit = codes.find(c => /^\d{5}$/.test(c));
    if (fiveDigit) return fiveDigit;
    
    // Preferir códigos mencionados cerca de palabras clave
    const keywords = ['código', 'code', 'verification', 'verificación', 'OTP', 'verifica', 'verify'];
    for (const code of codes) {
      const index = fullText.toLowerCase().indexOf(code.toLowerCase());
      if (index !== -1) {
        const context = fullText.substring(Math.max(0, index - 50), index + 50).toLowerCase();
        if (keywords.some(kw => context.includes(kw))) {
          return code;
        }
      }
    }
  }
  
  // Si solo hay un código, devolverlo si tiene longitud razonable
  if (codes.length === 1 && codes[0].length >= 4 && codes[0].length <= 8) {
    return codes[0];
  }
  
  return codes[0] || null;
}

export function detectServiceType(from, subject) {
  const combined = (from + ' ' + subject).toLowerCase();
  
  if (combined.includes('tiktok')) return { service: 'TikTok', name: 'TikTok', icon: '🎵', type: 'Código de verificación' };
  if (combined.includes('instagram')) return { service: 'Instagram', name: 'Instagram', icon: '📸', type: 'Código de verificación' };
  if (combined.includes('facebook') || combined.includes('meta')) return { service: 'Facebook', name: 'Facebook', icon: '👥', type: 'Código de verificación' };
  if (combined.includes('discord')) return { service: 'Discord', name: 'Discord', icon: '🎮', type: 'Invitación' };
  if (combined.includes('twitter') || combined.includes('x.com')) return { service: 'Twitter', name: 'Twitter/X', icon: '🐦', type: 'Verificación' };
  if (combined.includes('paypal')) return { service: 'PayPal', name: 'PayPal', icon: '💰', type: 'Recibo' };
  if (combined.includes('netflix')) return { service: 'Netflix', name: 'Netflix', icon: '🎬', type: 'Cuenta' };
  if (combined.includes('spotify')) return { service: 'Spotify', name: 'Spotify', icon: '🎵', type: 'Cuenta' };
  if (combined.includes('github')) return { service: 'GitHub', name: 'GitHub', icon: '💻', type: 'Verificación' };
  if (combined.includes('linkedin')) return { service: 'LinkedIn', name: 'LinkedIn', icon: '💼', type: 'Invitación' };
  if (combined.includes('amazon')) return { service: 'Amazon', name: 'Amazon', icon: '📦', type: 'Pedido' };
  if (combined.includes('google')) return { service: 'Google', name: 'Google', icon: '🔍', type: 'Seguridad' };
  
  // Detectar por tipo de contenido
  if (combined.includes('welcome') || combined.includes('bienvenid')) return { service: 'Desconocido', name: 'Bienvenida', icon: '👋', type: 'Bienvenida' };
  if (combined.includes('verify') || combined.includes('verificar')) return { service: 'Desconocido', name: 'Verificación', icon: '✅', type: 'Verificación' };
  if (combined.includes('invoice') || combined.includes('factura')) return { service: 'Desconocido', name: 'Factura', icon: '📄', type: 'Factura' };
  if (combined.includes('receipt') || combined.includes('recibo')) return { service: 'Desconocido', name: 'Recibo', icon: '🧾', type: 'Recibo' };
  
  return { service: 'Desconocido', name: 'Mensaje general', icon: '📧', type: 'Mensaje' };
}
