// Almacenamiento local de emails para persistencia
// ⭐ EMAILS PERMANENTES - Sin expiración automática

const STORAGE_KEY = 'tempmail_emails';
const MAX_EMAILS_PER_ACCOUNT = 100; // Límite por cuenta
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB límite total
const MAX_ACCOUNTS = 10; // Máximo 10 cuentas

export function saveEmails(emailAddress, emails) {
  try {
    // Limitar cantidad de emails por cuenta
    const limitedEmails = emails.slice(0, MAX_EMAILS_PER_ACCOUNT);
    
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    storage[emailAddress] = {
      emails: limitedEmails,
      lastUpdate: Date.now(),
      count: limitedEmails.length,
      permanent: true
    };
    
    const serialized = JSON.stringify(storage);
    
    // Verificar tamaño antes de guardar
    if (serialized.length > MAX_TOTAL_SIZE) {
      console.warn('⚠️ localStorage cerca del límite, limpiando emails antiguos');
      
      // Limpiar cuentas más antiguas
      const sorted = Object.entries(storage)
        .sort((a, b) => b[1].lastUpdate - a[1].lastUpdate)
        .slice(0, MAX_ACCOUNTS);
      
      const cleaned = Object.fromEntries(sorted);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      
      return { success: true, warning: 'Limpieza automática realizada' };
    }
    
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
    
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('❌ localStorage lleno, limpiando...');
      
      // Emergencia: limpiar todo excepto esta cuenta
      const minimal = {
        [emailAddress]: {
          emails: emails.slice(0, 20), // Solo últimos 20
          lastUpdate: Date.now(),
          count: 20,
          permanent: true
        }
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      return { success: true, warning: 'Limpieza de emergencia realizada' };
    }
    
    console.error('Error guardando emails:', error);
    return { success: false, error: error.message };
  }
}

export function getEmails(emailAddress) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const data = storage[emailAddress];
    
    if (!data) return null;
    
    // Emails permanentes - sin verificación de expiración
    return data.emails;
  } catch (error) {
    console.error('Error leyendo emails:', error);
    return null;
  }
}

export function getEmailCount(emailAddress) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const data = storage[emailAddress];
    
    if (!data) return 0;
    
    // Emails permanentes - sin verificación de expiración
    return data.count || 0;
  } catch (error) {
    console.error('Error leyendo contador:', error);
    return 0;
  }
}

export function clearEmails(emailAddress) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    delete storage[emailAddress];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Error limpiando emails:', error);
  }
}

export function getAllEmailCounts() {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const counts = {};
    
    // Emails permanentes - devolver todos los contadores sin filtrar por tiempo
    Object.keys(storage).forEach(email => {
      counts[email] = storage[email].count || 0;
    });
    
    return counts;
  } catch (error) {
    console.error('Error leyendo contadores:', error);
    return {};
  }
}

// Función para obtener información de uso de almacenamiento
export function getStorageInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || '{}';
    const sizeBytes = new Blob([data]).size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const percentUsed = ((sizeBytes / MAX_TOTAL_SIZE) * 100).toFixed(1);
    
    return {
      sizeBytes,
      sizeKB,
      sizeMB,
      percentUsed,
      warning: percentUsed > 80
    };
  } catch (error) {
    return null;
  }
}

// Limpiar cuentas antiguas manualmente
export function cleanOldAccounts(keepCount = MAX_ACCOUNTS) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    const sorted = Object.entries(storage)
      .sort((a, b) => b[1].lastUpdate - a[1].lastUpdate)
      .slice(0, keepCount);
    
    const cleaned = Object.fromEntries(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    
    return { success: true, kept: sorted.length };
  } catch (error) {
    console.error('Error limpiando cuentas:', error);
    return { success: false, error: error.message };
  }
}
