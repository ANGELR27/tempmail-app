# 🎉 Emails Permanentes - Documentación

## ¿Qué cambió?

Ahora tu aplicación **NO elimina los emails automáticamente**. Los emails se mantienen **permanentemente** hasta que TÚ decidas eliminarlos manualmente.

---

## 📝 Cambios Realizados

### Backend (`server/index-mailtm.js`)

1. **Expiración eliminada:**
   - `emailLifetime = null` (antes: 1 hora)
   - Los emails en Redis ya NO tienen tiempo de expiración
   
2. **Nueva API para eliminar cuenta:**
   ```
   DELETE /api/account/:address
   ```
   - Elimina la cuenta del sistema (Redis + memoria)
   - Solo se ejecuta cuando el usuario lo decide

3. **Respuesta API actualizada:**
   ```json
   {
     "email": "usuario@mail.tm",
     "expiresIn": null,
     "permanent": true,
     "provider": "mail.tm"
   }
   ```

### Frontend (`client/src/App.jsx`)

1. **UI actualizada:**
   - ✅ "Email permanente - No expira automáticamente"
   - ✅ Título cambiado a "Tu dirección permanente"
   - ✅ Botón rojo "Eliminar" para eliminar cuenta

2. **Nueva función `deleteAccount()`:**
   - Pide confirmación antes de eliminar
   - Elimina la cuenta del servidor
   - Limpia el historial y estado local

---

## 🚀 Cómo Usar

### Crear Email
1. Haz clic en **"Generar Email"**
2. Tu email será **permanente** (sin expiración)
3. Recibe mensajes normalmente

### Eliminar Email
1. Haz clic en el botón rojo **"Eliminar"**
2. Confirma la eliminación
3. La cuenta se elimina permanentemente

---

## ⚠️ Importante

### Limitación de Mail.tm
Aunque tu sistema NO expira los emails, el proveedor externo **Mail.tm** puede:
- Eliminar cuentas inactivas después de mucho tiempo
- Tener límites en su servicio gratuito

### Alternativa: Servidor SMTP Propio
Si quieres **control total**, puedes usar tu propio servidor SMTP:
- Ya tienes el código en `server/index.js`
- Requiere configurar puertos SMTP (puerto 2525)
- Control absoluto sobre la persistencia

---

## 🔧 Persistencia

### Actual (Memoria + Redis)
- **Sin Redis:** Los emails se pierden al reiniciar
- **Con Redis:** Los emails persisten entre reinicios

### Para persistencia real:
1. Conecta Redis en Railway (variable `REDIS_URL`)
2. Los emails se guardarán permanentemente en Redis

---

## 📊 Comparación

| Característica | Antes | Ahora |
|---|---|---|
| **Expiración automática** | 1 hora | ❌ Nunca |
| **Control del usuario** | ❌ No | ✅ Sí |
| **Eliminar manualmente** | ❌ No | ✅ Sí |
| **Historial** | Se borra | ✅ Permanente |

---

## ✅ Ventajas

✅ **Control total**: Tú decides cuándo eliminar  
✅ **Sin presión**: No hay temporizador  
✅ **Historial completo**: Acceso a todos tus emails  
✅ **Más útil**: Ideal para verificaciones que toman tiempo  

---

## 🎨 Cambios Visuales

- 🟢 Badge "Email permanente" en verde
- 🔴 Botón rojo "Eliminar" visible
- ⭐ Mensaje claro: "Solo se elimina cuando tú decidas"

---

## 🔍 Para Desarrolladores

### Backend
```javascript
// server/index-mailtm.js línea 11-12
const emailLifetime = null; // null = permanente
```

### Frontend
```javascript
// client/src/App.jsx
const deleteAccount = async () => {
  await fetch(`${API_URL}/account/${encodeURIComponent(currentEmail)}`, {
    method: 'DELETE',
  });
  // Limpiar estado...
}
```

---

**¡Disfruta de tus emails permanentes!** 🎉
