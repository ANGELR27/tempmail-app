// Hook para polling inteligente con backoff exponencial
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para polling inteligente que reduce la frecuencia cuando no hay actividad
 * 
 * @param {Function} callback - Función a ejecutar en cada poll (debe retornar true si hay nuevos datos)
 * @param {any} dependency - Dependencia que reinicia el polling
 * @param {Object} options - Opciones de configuración
 */
export function useSmartPolling(callback, dependency, options = {}) {
  const {
    minDelay = 5000,      // 5 segundos mínimo
    maxDelay = 60000,     // 60 segundos máximo
    backoffMultiplier = 1.5,
    emptyThreshold = 3     // Después de 3 polls vacíos, empezar backoff
  } = options;
  
  const timeoutRef = useRef(null);
  const consecutiveEmpty = useRef(0);
  const currentDelay = useRef(minDelay);
  const isActive = useRef(true);
  
  const poll = useCallback(async () => {
    if (!isActive.current) return;
    
    try {
      const hasNewData = await callback();
      
      if (hasNewData) {
        // Reset a mínimo si hay nuevos datos
        consecutiveEmpty.current = 0;
        currentDelay.current = minDelay;
        console.log('🔄 Nuevos datos detectados, polling reseteado a', minDelay, 'ms');
      } else {
        // Incrementar contador de polls vacíos
        consecutiveEmpty.current++;
        
        // Después del threshold, aumentar delay gradualmente
        if (consecutiveEmpty.current >= emptyThreshold) {
          const newDelay = Math.min(
            currentDelay.current * backoffMultiplier,
            maxDelay
          );
          
          if (newDelay !== currentDelay.current) {
            currentDelay.current = newDelay;
            console.log(`⏳ Sin nuevos datos (${consecutiveEmpty.current}x), aumentando intervalo a ${Math.round(newDelay/1000)}s`);
          }
        }
      }
    } catch (error) {
      console.error('Error en polling:', error);
    }
    
    // Programar siguiente poll
    if (isActive.current) {
      timeoutRef.current = setTimeout(poll, currentDelay.current);
    }
  }, [callback, minDelay, maxDelay, backoffMultiplier, emptyThreshold]);
  
  useEffect(() => {
    if (!dependency) {
      // Limpiar si no hay dependencia
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }
    
    // Reset e iniciar polling
    isActive.current = true;
    consecutiveEmpty.current = 0;
    currentDelay.current = minDelay;
    
    console.log('🔄 Iniciando polling inteligente para:', dependency);
    poll();
    
    return () => {
      isActive.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      console.log('⏸️ Polling detenido');
    };
  }, [dependency, poll, minDelay]);
  
  // Función para forzar un poll inmediato
  const forcePoll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    consecutiveEmpty.current = 0;
    currentDelay.current = minDelay;
    poll();
  }, [poll, minDelay]);
  
  return { forcePoll };
}
