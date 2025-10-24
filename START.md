# 🚀 INICIO RÁPIDO

## 📋 Requisitos
- Node.js 18+ instalado
- Puerto 3000, 3001 y 2525 disponibles

## ⚡ Comenzar en 3 Pasos

### 1. Instalar Dependencias
Abre PowerShell en esta carpeta y ejecuta:

```powershell
npm run install-all
```

Esto instalará todas las dependencias del backend y frontend.

### 2. Iniciar la Aplicación
```powershell
npm run dev
```

Verás algo como:
```
🚀 Servidor API escuchando en puerto 3001
📨 Servidor SMTP escuchando en puerto 2525
🌐 WebSocket disponible en ws://localhost:3001

VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:3000/
```

### 3. Abrir en el Navegador
```
http://localhost:3000
```

---

## 🧪 Probar que Funciona

### Método 1: Interfaz Web
1. Abre `http://localhost:3000`
2. Clic en "Generar Email"
3. Copia el email generado (ej: `abc123@tempmail.local`)

### Método 2: Enviar Email de Prueba

**Con PowerShell (Recomendado):**
```powershell
.\test-email.ps1 -EmailDestino "abc123@tempmail.local"
```

**Con Node.js:**
```powershell
node test-email.js abc123@tempmail.local
```

Reemplaza `abc123@tempmail.local` con el email que generaste.

---

## 📁 Estructura del Proyecto

```
tempmail-app/
├── server/              # Backend Node.js
│   └── index.js        # Servidor SMTP + API + WebSocket
├── client/             # Frontend React
│   ├── src/
│   │   ├── App.jsx    # Componente principal
│   │   └── index.css  # Estilos
│   └── package.json
├── package.json        # Dependencias backend
├── .env               # Configuración
└── README.md          # Documentación completa
```

---

## 🎯 Comandos Disponibles

```powershell
# Iniciar todo (backend + frontend)
npm run dev

# Solo backend
npm run server

# Solo frontend
npm run client

# Instalar todas las dependencias
npm run install-all

# Construir para producción
npm run build
```

---

## 🌐 URLs Importantes

- **Aplicación Web**: http://localhost:3000
- **API Backend**: http://localhost:3001/api
- **Servidor SMTP**: localhost:2525
- **WebSocket**: ws://localhost:3001

---

## ❓ Problemas Comunes

### Puerto en uso
```powershell
# Ver qué proceso usa el puerto 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Matar el proceso
Stop-Process -Id PROCESS_ID -Force
```

### Error al instalar dependencias
```powershell
# Limpiar cache y reinstalar
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install
```

### No llegan los emails
1. Verifica que el servidor esté corriendo
2. Comprueba que el dominio sea `@tempmail.local`
3. Revisa los logs en la consola del servidor

---

## 📚 Documentación Completa

- **README.md** - Documentación técnica completa
- **GUIA_RAPIDA.md** - Guía de referencia rápida
- **test-email.ps1** - Script de prueba PowerShell
- **test-email.js** - Script de prueba Node.js

---

## 💡 Características Principales

✅ **Generación Instantánea** - Crea emails temporales al instante  
✅ **Servidor SMTP Propio** - Recibe correos reales  
✅ **Tiempo Real** - WebSocket para actualizaciones instantáneas  
✅ **UI Moderna** - React + TailwindCSS  
✅ **Auto-Expiración** - Los emails se borran después de 1 hora  
✅ **Notificaciones** - Alertas de escritorio para nuevos correos  

---

## 🎨 Tecnologías Usadas

**Backend:**
- Node.js + Express
- smtp-server (para recibir emails)
- WebSocket (ws)
- mailparser

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Lucide Icons

---

## 🚀 ¡Listo para Usar!

La aplicación está completamente funcional y lista para desarrollo.

**Próximo Paso:** Abre `http://localhost:3000` y genera tu primer email temporal 🎉

---

**¿Necesitas ayuda?** Revisa el README.md completo o los scripts de prueba incluidos.
