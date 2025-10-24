// Almacenamiento local de emails para persistencia

const STORAGE_KEY = 'tempmail_emails';
const EXPIRATION_TIME = 60 * 60 * 1000; // 1 hora

export function saveEmails(emailAddress, emails) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    storage[emailAddress] = {
      emails: emails,
      lastUpdate: Date.now(),
      count: emails.length
    };
    
    // Limpiar emails expirados
    const now = Date.now();
    Object.keys(storage).forEach(email => {
      if (now - storage[email].lastUpdate > EXPIRATION_TIME) {
        delete storage[email];
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Error guardando emails:', error);
  }
}

export function getEmails(emailAddress) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const data = storage[emailAddress];
    
    if (!data) return null;
    
    // Verificar expiración
    if (Date.now() - data.lastUpdate > EXPIRATION_TIME) {
      delete storage[emailAddress];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return null;
    }
    
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
    
    // Verificar expiración
    if (Date.now() - data.lastUpdate > EXPIRATION_TIME) {
      return 0;
    }
    
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
    const now = Date.now();
    
    Object.keys(storage).forEach(email => {
      if (now - storage[email].lastUpdate <= EXPIRATION_TIME) {
        counts[email] = storage[email].count || 0;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error leyendo contadores:', error);
    return {};
  }
}
