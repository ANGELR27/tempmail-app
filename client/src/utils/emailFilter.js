// Utilidad para filtrar y buscar emails

/**
 * Filtra emails basado en término de búsqueda y filtros
 */
export function filterEmails(emails, searchTerm = '', filters = {}) {
  if (!emails || emails.length === 0) return [];
  
  let filtered = [...emails];
  
  // Búsqueda por texto
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    
    filtered = filtered.filter(email => {
      // Buscar en múltiples campos
      const searchableText = [
        email.subject || '',
        email.from || '',
        email.to || '',
        email.text || '',
        email.intro || '',
        email.extractedCode || ''
      ].join(' ').toLowerCase();
      
      return searchableText.includes(term);
    });
  }
  
  // Filtro por servicio
  if (filters.service && filters.service !== 'all') {
    filtered = filtered.filter(email => 
      email.serviceInfo?.service === filters.service
    );
  }
  
  // Filtro por rango de fechas
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(email => 
      new Date(email.date) >= fromDate
    );
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // Incluir todo el día
    filtered = filtered.filter(email => 
      new Date(email.date) <= toDate
    );
  }
  
  // Filtro: solo emails con códigos
  if (filters.onlyWithCodes) {
    filtered = filtered.filter(email => email.extractedCode);
  }
  
  // Filtro: solo no leídos
  if (filters.onlyUnread) {
    filtered = filtered.filter(email => !email.seen);
  }
  
  // Filtro: solo con adjuntos
  if (filters.onlyWithAttachments) {
    filtered = filtered.filter(email => email.hasAttachments);
  }
  
  return filtered;
}

/**
 * Obtiene lista única de servicios presentes en los emails
 */
export function getAvailableServices(emails) {
  if (!emails || emails.length === 0) return [];
  
  const services = new Set();
  emails.forEach(email => {
    if (email.serviceInfo?.service) {
      services.add(email.serviceInfo.service);
    }
  });
  
  return Array.from(services).sort();
}

/**
 * Búsqueda rápida por código
 */
export function searchByCode(emails, code) {
  if (!code || !emails) return [];
  
  const searchCode = code.trim().toLowerCase();
  return emails.filter(email => 
    email.extractedCode?.toLowerCase().includes(searchCode)
  );
}

/**
 * Agrupar emails por servicio
 */
export function groupByService(emails) {
  if (!emails || emails.length === 0) return {};
  
  return emails.reduce((groups, email) => {
    const service = email.serviceInfo?.service || 'Otros';
    if (!groups[service]) {
      groups[service] = [];
    }
    groups[service].push(email);
    return groups;
  }, {});
}

/**
 * Ordenar emails
 */
export function sortEmails(emails, sortBy = 'date', order = 'desc') {
  if (!emails || emails.length === 0) return [];
  
  const sorted = [...emails];
  
  sorted.sort((a, b) => {
    let compareA, compareB;
    
    switch (sortBy) {
      case 'date':
        compareA = new Date(a.date).getTime();
        compareB = new Date(b.date).getTime();
        break;
      case 'subject':
        compareA = (a.subject || '').toLowerCase();
        compareB = (b.subject || '').toLowerCase();
        break;
      case 'from':
        compareA = (a.from || '').toLowerCase();
        compareB = (b.from || '').toLowerCase();
        break;
      default:
        compareA = new Date(a.date).getTime();
        compareB = new Date(b.date).getTime();
    }
    
    if (order === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });
  
  return sorted;
}
