// Almacenamiento local de emails para persistencia
// ⭐ EMAILS PERMANENTES - Sin expiración automática

const STORAGE_KEY = 'tempmail_emails';
// Sin tiempo de expiración - los emails persisten hasta que el usuario los elimine

export function saveEmails(emailAddress, emails) {
  try {
    const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    
    storage[emailAddress] = {
      emails: emails,
      lastUpdate: Date.now(),
      count: emails.length,
      permanent: true // Indicar que es permanente
    };
    
    // Ya NO limpiamos emails por tiempo - son permanentes
    
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
