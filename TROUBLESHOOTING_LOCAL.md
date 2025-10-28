# 🔧 Solución de Problemas - Errores en Local

## Error: "Failed to execute 'json' on 'Response': Unexpected end of JSON input"

### 🔍 Causa
Este error ocurre cuando:
1. La API de Mail.tm no responde correctamente
2. El servidor devuelve una respuesta vacía
3. Hay problemas de conectividad con Mail.tm

### ✅ Soluciones Implementadas

#### 1. **Reintentos automáticos** (`server/mailtm.js`)
- El sistema ahora reintenta 3 veces antes de fallar
- Backoff exponencial: 1s, 2s, 4s entre intentos
- Validación completa de las respuestas de la API

#### 2. **Mejor manejo de errores** (`server/index-mailtm.js`)
- Logs más detallados para debugging
- Redis opcional (funciona sin Redis en local)
- Mensajes de error claros y específicos

#### 3. **Frontend mejorado** (`client/src/App.jsx`)
- Validación de respuestas JSON
- Mensajes de error descriptivos para el usuario
- Mejor manejo de casos edge

### 🧪 Cómo Probar

#### 1. **Reiniciar el servidor**
```powershell
# Detener el servidor actual (Ctrl+C en la terminal)
# Luego reiniciar
npm run dev
```

#### 2. **Verificar la API de Mail.tm**
```powershell
# Probar que Mail.tm esté disponible
curl https://api.mail.tm/domains
```

Si devuelve JSON con dominios, la API está funcionando.

#### 3. **Limpiar caché del navegador**
- Abre DevTools (F12)
- Application → Storage → Clear site data
- Recarga la página (Ctrl+Shift+R)

#### 4. **Probar generación de email**
1. Abre http://localhost:3000
2. Haz clic en "Generar Email"
3. Revisa la consola del navegador (F12) y del servidor

### 📊 Logs Esperados

#### Cuando todo funciona bien:
```
🔄 Intento 1/3 - Creando cuenta en Mail.tm...
📧 Usando dominio: guerrillamail.info
✅ Email temporal creado exitosamente: abc123@guerrillamail.info
💾 Cuenta guardada en Redis
✅ Email creado exitosamente: abc123@guerrillamail.info (mail.tm)
```

#### Cuando hay problemas:
```
❌ Intento 1/3 falló: { message: 'timeout of 10000ms exceeded' }
⏳ Esperando 1000ms antes de reintentar...
🔄 Intento 2/3 - Creando cuenta en Mail.tm...
...
```

### 🔍 Diagnóstico Adicional

#### Verificar que los servicios estén corriendo:
```powershell
# Ver procesos de Node.js
Get-Process -Name node

# Ver puertos en uso
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

#### Verificar logs del servidor:
Busca en la terminal del servidor líneas como:
- `🚀 Servidor API escuchando en puerto 3001`
- `📁 Sirviendo archivos estáticos desde:`
- `⚠️ Redis no configurado, usando almacenamiento en memoria`

### 🛠️ Soluciones Específicas

#### Si Mail.tm está caído:

El sistema ahora tiene **failover automático**. Si Mail.tm falla después de 3 intentos, intentará con proveedores alternativos:

```javascript
// El sistema intentará en orden:
1. Mail.tm (3 intentos con reintentos)
2. Mailsac (como backup)
```

#### Si Redis no está configurado (normal en local):

No hay problema. El sistema funcionará sin Redis:
```
⚠️ Redis no configurado, usando almacenamiento en memoria
```

Las cuentas se guardarán en:
- Memoria del servidor (se pierden al reiniciar)
- LocalStorage del navegador (persistente)

#### Si el problema persiste:

1. **Verifica tu conexión a internet**:
   ```powershell
   ping api.mail.tm
   ```

2. **Prueba con curl directamente**:
   ```powershell
   curl -X POST http://localhost:3001/api/generate-email
   ```

3. **Revisa los logs completos del servidor**:
   - Busca errores específicos
   - Copia el stack trace completo

4. **Limpia node_modules y reinstala**:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force client/node_modules
   npm install
   cd client
   npm install
   cd ..
   ```

### 📝 Variables de Entorno (Opcional)

Si quieres configurar Redis en local:

```env
# .env (en la raíz del proyecto)
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3001
```

### 🚀 Después de los Cambios

Una vez que funcione en local, puedes desplegar a Railway:

```bash
git add .
git commit -m "fix: Mejorar manejo de errores y reintentos en Mail.tm"
git push origin main
```

### 📞 Información Adicional

- **Mail.tm API Docs**: https://docs.mail.tm/
- **Status de Mail.tm**: Revisa si hay problemas conocidos
- **Rate Limits**: Mail.tm tiene límites de uso, el sistema ahora los maneja mejor

---

**Última actualización**: Octubre 2025
