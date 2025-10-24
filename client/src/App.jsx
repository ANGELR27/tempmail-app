import { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, Copy, Check, Trash2, Clock, Inbox, ExternalLink, History, X, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { extractMainCode, detectServiceType } from './utils/codeExtractor';
import { updateStats } from './utils/stats';
import { StatsPanel } from './components/StatsPanel';
import { saveEmails, getEmails, getEmailCount, getAllEmailCounts, clearEmails } from './utils/emailStorage';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001'; // WebSocket solo funciona en desarrollo local

function App() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ws, setWs] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [emailCreatedTime, setEmailCreatedTime] = useState(null);
  const [emailCounts, setEmailCounts] = useState({});

  // Cargar historial de emails desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('emailHistory');
    if (saved) {
      try {
        setEmailHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando historial:', e);
      }
    }
    
    // Cargar contadores
    setEmailCounts(getAllEmailCounts());
  }, []);
  
  // Actualizar contadores periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setEmailCounts(getAllEmailCounts());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Guardar email en historial
  const saveToHistory = (email, expiresAt) => {
    const newHistory = [
      { email, createdAt: Date.now(), expiresAt },
      ...emailHistory.filter(item => item.email !== email)
    ].slice(0, 20); // Mantener solo los últimos 20
    
    setEmailHistory(newHistory);
    localStorage.setItem('emailHistory', JSON.stringify(newHistory));
  };

  // Eliminar del historial
  const removeFromHistory = (email) => {
    const newHistory = emailHistory.filter(item => item.email !== email);
    setEmailHistory(newHistory);
    localStorage.setItem('emailHistory', JSON.stringify(newHistory));
  };

  // Obtener información del servidor
  useEffect(() => {
    fetch(`${API_URL}/info`)
      .then(res => res.json())
      .then(setServerInfo)
      .catch(console.error);
  }, []);

  // Conectar WebSocket (solo en desarrollo)
  useEffect(() => {
    if (!currentEmail || import.meta.env.PROD) return;

    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('🔌 WebSocket conectado');
      websocket.send(JSON.stringify({
        type: 'subscribe',
        email: currentEmail
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new-email') {
        console.log('📬 Nuevo email recibido en tiempo real');
        setEmails(prev => [data.email, ...prev]);
        
        // Mostrar notificación
        if (Notification.permission === 'granted') {
          new Notification('Nuevo correo recibido', {
            body: `De: ${data.email.from}\n${data.email.subject}`,
            icon: '/mail.svg'
          });
        }
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('🔌 WebSocket desconectado');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [currentEmail]);

  // Solicitar permisos de notificación
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const generateEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-email`, {
        method: 'POST',
      });
      const data = await response.json();
      setCurrentEmail(data.email);
      setEmails([]);
      setSelectedEmail(null);
      
      // Guardar tiempo de creación
      setEmailCreatedTime(Date.now());
      
      // Guardar en historial (permanente - sin expiración)
      const expiresAt = data.permanent ? null : (Date.now() + data.expiresIn);
      saveToHistory(data.email, expiresAt);
    } catch (error) {
      console.error('Error generando email:', error);
      alert('Error al generar email');
    } finally {
      setLoading(false);
    }
  };
  
  // Cambiar a un email del historial
  const switchToEmail = (email) => {
    setCurrentEmail(email);
    setEmails([]);
    setSelectedEmail(null);
    setShowHistory(false);
  };

  const fetchEmails = useCallback(async () => {
    if (!currentEmail) return;
    
    // Primero intentar cargar desde localStorage
    const cachedEmails = getEmails(currentEmail);
    if (cachedEmails && cachedEmails.length > 0) {
      setEmails(cachedEmails);
    }
    
    try {
      const response = await fetch(`${API_URL}/emails/${encodeURIComponent(currentEmail)}`);
      if (response.ok) {
        const data = await response.json();
        
        // Procesar emails y detectar códigos
        const processedEmails = data.emails.map(email => {
          const code = extractMainCode(email.text || email.intro, email.subject);
          const serviceInfo = detectServiceType(email.from, email.subject);
          
          return {
            ...email,
            extractedCode: code,
            serviceInfo
          };
        });
        
        // Usar función de actualización para detectar nuevos emails sin depender del estado
        setEmails(prevEmails => {
          // 🔒 PROTECCIÓN: Si la API devuelve vacío pero tenemos emails en cache, mantener cache
          if (processedEmails.length === 0 && prevEmails.length > 0) {
            console.log('📦 Preservando', prevEmails.length, 'emails del cache (API vacía)');
            return prevEmails; // Mantener emails existentes
          }
          
          // Detectar nuevos emails
          const newEmails = processedEmails.filter(
            pe => !prevEmails.find(e => e.id === pe.id)
          );
          
          if (newEmails.length > 0) {
            newEmails.forEach(email => {
              // Actualizar estadísticas
              updateStats({
                service: email.serviceInfo?.service || 'Desconocido',
                receivedTime: Date.now(),
                emailCreatedTime: emailCreatedTime
              });
              
              // Mostrar notificación mejorada
              if (Notification.permission === 'granted') {
                const code = email.extractedCode;
                const title = (email.serviceInfo?.icon || '📧') + ' ' + (email.serviceInfo?.service || 'Nuevo mensaje');
                const body = code 
                  ? `Código: ${code} - ${email.subject}`
                  : email.subject;
                
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    payload: {
                      title,
                      body,
                      icon: '/mail.svg',
                      badge: '/mail.svg',
                      tag: email.id,
                      data: { code, email: currentEmail }
                    }
                  });
                } else {
                  new Notification(title, { body, icon: '/mail.svg' });
                }
                
                // Vibrar en móvil
                if ('vibrate' in navigator) {
                  navigator.vibrate([200, 100, 200]);
                }
              }
            });
          }
          
          // Combinar emails: preferir los de la API, pero agregar los del cache que no están en la API
          let finalEmails = processedEmails;
          if (processedEmails.length > 0) {
            const apiIds = new Set(processedEmails.map(e => e.id));
            const cacheOnly = prevEmails.filter(e => !apiIds.has(e.id));
            
            if (cacheOnly.length > 0) {
              console.log('🔄 Combinando', processedEmails.length, 'de API +', cacheOnly.length, 'del cache');
              finalEmails = [...processedEmails, ...cacheOnly];
            }
          }
          
          // Guardar en localStorage el estado final
          saveEmails(currentEmail, finalEmails);
          
          // Actualizar contador
          setEmailCounts(prev => ({
            ...prev,
            [currentEmail]: finalEmails.length
          }));
          
          return finalEmails;
        });
      } else {
        console.warn('⚠️ Error al obtener emails:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error obteniendo emails:', error);
    }
  }, [currentEmail, emailCreatedTime]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteEmail = async (emailId) => {
    try {
      await fetch(`${API_URL}/emails/${encodeURIComponent(currentEmail)}/${emailId}`, {
        method: 'DELETE',
      });
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error eliminando email:', error);
    }
  };

  // 🗑️ Eliminar cuenta permanentemente
  const deleteAccount = async () => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de email permanentemente?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      await fetch(`${API_URL}/account/${encodeURIComponent(currentEmail)}`, {
        method: 'DELETE',
      });
      
      // Eliminar del historial
      removeFromHistory(currentEmail);
      
      // Limpiar emails del localStorage
      clearEmails(currentEmail);
      
      // Limpiar estado
      setCurrentEmail('');
      setEmails([]);
      setSelectedEmail(null);
      
      // Actualizar contadores
      setEmailCounts(getAllEmailCounts());
      
      alert('✅ Cuenta eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      alert('❌ Error al eliminar la cuenta');
    }
  };

  useEffect(() => {
    if (currentEmail) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 5000);
      return () => clearInterval(interval);
    }
  }, [currentEmail, fetchEmails]);

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Panel de Estadísticas */}
      {showStats && (
        <StatsPanel onClose={() => setShowStats(false)} />
      )}

      {/* Sidebar de Historial */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowHistory(false)}>
          <div 
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-slate-900 shadow-2xl z-50 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6 text-primary-400" />
                  Historial de Emails
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {emailHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay emails en el historial</p>
                  <p className="text-sm mt-2">Los emails generados aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map((item) => {
                    const messageCount = emailCounts[item.email] || 0;
                    const hasMessages = messageCount > 0;
                    
                    return (
                      <div
                        key={item.email}
                        className={`p-4 rounded-lg border transition-all relative ${
                          currentEmail === item.email
                            ? 'bg-primary-500/20 border-primary-500'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => switchToEmail(item.email)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-mono text-sm break-all flex-1">
                                {item.email}
                              </div>
                              {hasMessages && (
                                <div className="flex items-center gap-1">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-semibold">
                                    {messageCount} {messageCount === 1 ? 'mensaje' : 'mensajes'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              Creado {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
                            </div>
                          </button>
                          <button
                            onClick={() => removeFromHistory(item.email)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-primary-500 p-3 rounded-2xl">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              TempMail
            </h1>
            
            {/* Botones de Historial y Estadísticas */}
            <div className="absolute right-4 top-0 flex gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Estadísticas
              </button>
              {emailHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Historial ({emailHistory.length})
                </button>
              )}
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            Correo electrónico temporal - Protege tu privacidad
          </p>
        </div>

        {/* Email Generator */}
        <div className="card p-6 mb-6">
          {!currentEmail ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Generar dirección de email
              </h2>
              <p className="text-slate-400 mb-6">
                ⭐ Crea un email <strong className="text-primary-400">permanente</strong> - Solo se elimina cuando tú decidas
              </p>
              <button
                onClick={generateEmail}
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Generar Email
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-300">
                  Tu dirección permanente
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={deleteAccount}
                    className="btn-secondary inline-flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/20"
                    title="Eliminar cuenta permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                  <button
                    onClick={generateEmail}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Nueva
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <input
                  type="text"
                  value={currentEmail}
                  readOnly
                  className="flex-1 bg-transparent outline-none text-lg font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-primary-400 font-medium">
                  ⭐ Email permanente - No expira automáticamente
                </span>
                <span className={`text-sm font-medium ${emails.length > 0 ? 'text-primary-400' : 'text-slate-400'}`}>
                  <Inbox className="w-4 h-4 inline mr-1" />
                  {emails.length} {emails.length === 1 ? 'mensaje' : 'mensajes'}
                </span>
              </div>
            </div>
          )}
        </div>

        {currentEmail && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de emails */}
            <div className="lg:col-span-1">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-primary-400" />
                    Bandeja de entrada
                  </h3>
                  <button
                    onClick={fetchEmails}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {emails.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="relative inline-block mb-4">
                        <Mail className="w-16 h-16 mx-auto opacity-20" />
                        <div className="absolute inset-0 animate-ping opacity-10">
                          <Mail className="w-16 h-16" />
                        </div>
                      </div>
                      <p className="font-semibold text-lg mb-2">No hay mensajes</p>
                      <p className="text-sm text-slate-500">
                        Los emails llegarán aquí automáticamente
                      </p>
                    </div>
                  ) : (
                    emails.map((email, index) => {
                      const isNew = index < 3; // Simular nuevos
                      const hasCode = email.extractedCode;
                      const initials = email.from.substring(0, 2).toUpperCase();
                      
                      return (
                        <button
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`group w-full text-left p-4 rounded-xl transition-all duration-200 ${
                            selectedEmail?.id === email.id
                              ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500 shadow-lg shadow-primary-500/20'
                              : 'bg-slate-800/40 hover:bg-slate-700/50 border-slate-700/50'
                          } border relative overflow-hidden`}
                        >
                          {/* Indicador de nuevo */}
                          {isNew && selectedEmail?.id !== email.id && (
                            <div className="absolute top-2 right-2">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                              selectedEmail?.id === email.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                            } transition-colors`}>
                              {initials}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Remitente */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">
                                  {email.from.split('@')[0]}
                                </span>
                                {hasCode && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                    Código
                                  </span>
                                )}
                              </div>
                              
                              {/* Asunto */}
                              <div className={`text-sm mb-1 truncate ${
                                selectedEmail?.id === email.id ? 'text-white font-medium' : 'text-slate-200'
                              }`}>
                                {email.subject}
                              </div>
                              
                              {/* Preview del contenido */}
                              <div className="text-xs text-slate-400 truncate mb-2">
                                {email.extractedCode || email.intro || email.text?.substring(0, 60) || 'Sin contenido'}
                              </div>
                              
                              {/* Fecha */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {formatDistanceToNow(new Date(email.date), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </span>
                                {email.hasAttachments && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    Adjunto
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Visor de email */}
            <div className="lg:col-span-2">
              <div className="card p-0 overflow-hidden">
                {!selectedEmail ? (
                  <div className="text-center py-20 text-slate-400 p-6">
                    <div className="relative inline-block mb-4">
                      <Mail className="w-20 h-20 mx-auto opacity-20" />
                      <div className="absolute inset-0 animate-pulse opacity-10">
                        <Mail className="w-20 h-20" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold mb-2">Selecciona un mensaje</p>
                    <p className="text-sm text-slate-500">Haz clic en un email para ver su contenido</p>
                  </div>
                ) : (
                  <div>
                    {/* Header del email */}
                    <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-b border-slate-700/50 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar grande */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white">
                            {selectedEmail.from.substring(0, 2).toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-3 text-white">
                              {selectedEmail.subject}
                            </h2>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 font-medium min-w-[60px]">De:</span>
                                <span className="font-mono text-slate-200 bg-slate-900/50 px-3 py-1 rounded-md">
                                  {selectedEmail.from}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 font-medium min-w-[60px]">Para:</span>
                                <span className="font-mono text-slate-200 bg-slate-900/50 px-3 py-1 rounded-md">
                                  {selectedEmail.to}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-400 font-medium min-w-[60px]">Fecha:</span>
                                <span className="text-slate-300">
                                  {new Date(selectedEmail.date).toLocaleString('es-ES', {
                                    dateStyle: 'full',
                                    timeStyle: 'short'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteEmail(selectedEmail.id)}
                          className="btn-secondary inline-flex items-center gap-2 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                      
                      {/* Badge de información */}
                      {selectedEmail.serviceInfo && (
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-xs px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 font-medium">
                            {selectedEmail.serviceInfo.name || 'Servicio detectado'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Código extraído destacado */}
                    {selectedEmail.extractedCode && (
                      <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-b border-primary-500/20 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                          <h3 className="font-bold text-primary-400 text-sm uppercase tracking-wide">Código de Verificación</h3>
                        </div>
                        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
                          <div className="text-center">
                            <div className="text-5xl font-black tracking-widest text-white mb-2 font-mono select-all">
                              {selectedEmail.extractedCode}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Haz clic para copiar</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedEmail.extractedCode);
                              alert('✅ Código copiado al portapapeles');
                            }}
                            className="w-full mt-4 btn-primary inline-flex items-center justify-center gap-2 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar Código
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Contenido del email */}
                    <div className="p-6">
                      <div className="prose prose-invert prose-lg max-w-none">
                        {selectedEmail.html ? (
                          <div className="rounded-xl overflow-hidden border border-slate-700">
                            <iframe
                              srcDoc={selectedEmail.html}
                              className="w-full min-h-[500px] bg-white"
                              sandbox="allow-same-origin"
                              title="Email content"
                            />
                          </div>
                        ) : (
                          <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                            <pre className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed">
                              {selectedEmail.text}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Archivos adjuntos */}
                      {selectedEmail.attachments?.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-700/50">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <ExternalLink className="w-5 h-5 text-primary-400" />
                            Archivos Adjuntos ({selectedEmail.attachments.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedEmail.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="group flex items-center gap-3 bg-gradient-to-r from-slate-800/50 to-slate-800/30 hover:from-slate-700/50 hover:to-slate-700/30 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer"
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                  <ExternalLink className="w-5 h-5 text-primary-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{att.filename}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    {(att.size / 1024).toFixed(2)} KB
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer con info del servidor */}
        {serverInfo && (
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>
              Servidor SMTP: localhost:{serverInfo.smtpPort} | Dominio: {serverInfo.domain}
            </p>
            <p className="mt-1">
              Emails activos: {serverInfo.activeEmails}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
