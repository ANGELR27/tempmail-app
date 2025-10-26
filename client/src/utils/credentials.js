// Gestión de credenciales de cuentas de email en localStorage

const CREDENTIALS_KEY = 'email_credentials';

/**
 * Guardar credenciales de una cuenta
 */
export function saveCredentials(email, credentials) {
  try {
    const allCredentials = getAllCredentials();
    allCredentials[email] = {
      ...credentials,
      savedAt: Date.now()
    };
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCredentials));
    console.log('🔑 Credenciales guardadas para:', email);
  } catch (error) {
    console.error('Error guardando credenciales:', error);
  }
}

/**
 * Obtener credenciales de una cuenta específica
 */
export function getCredentials(email) {
  try {
    const allCredentials = getAllCredentials();
    return allCredentials[email] || null;
  } catch (error) {
    console.error('Error obteniendo credenciales:', error);
    return null;
  }
}

/**
 * Obtener todas las credenciales guardadas
 */
export function getAllCredentials() {
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error cargando credenciales:', error);
    return {};
  }
}

/**
 * Eliminar credenciales de una cuenta
 */
export function deleteCredentials(email) {
  try {
    const allCredentials = getAllCredentials();
    delete allCredentials[email];
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(allCredentials));
    console.log('🗑️ Credenciales eliminadas para:', email);
  } catch (error) {
    console.error('Error eliminando credenciales:', error);
  }
}

/**
 * Limpiar todas las credenciales
 */
export function clearAllCredentials() {
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
    console.log('🧹 Todas las credenciales eliminadas');
  } catch (error) {
    console.error('Error limpiando credenciales:', error);
  }
}
