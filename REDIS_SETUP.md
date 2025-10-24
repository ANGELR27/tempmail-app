# 🔴 Configuración de Redis Cloud

Redis Cloud proporciona persistencia **GRATUITA** para tus emails. Sin Redis, los emails se pierden al reiniciar el servidor.

---

## 📋 Pasos para Configurar Redis Cloud

### 1️⃣ Crear Cuenta en Redis Cloud (5 min)

1. Ve a: https://redis.com/try-free/
2. Haz clic en **"Try Free"**
3. Regístrate con:
   - Google/GitHub (más rápido), o
   - Email y contraseña

### 2️⃣ Crear Base de Datos (3 min)

1. Después del login, haz clic en **"New database"**
2. Configuración:
   ```
   Database name:    tempmail-prod
   Type:             Redis Stack (recomendado)
   Cloud:            AWS
   Region:           us-east-1 (o el más cercano a ti)
   ```
3. Plan gratuito:
   ```
   ✅ 30MB storage (suficiente para ~1000 emails)
   ✅ 1 database
   ✅ Sin tarjeta de crédito
   ✅ No expira
   ```
4. Haz clic en **"Create database"**
5. Espera 1-2 minutos mientras se crea

### 3️⃣ Obtener Connection String

1. Cuando la DB esté lista, haz clic en ella
2. Copia los siguientes datos:
   ```
   Public endpoint:  redis-12345.c123.us-east-1-1.ec2.redns.redis-cloud.com:12345
   Default user password:  ************
   ```
3. Construye tu `REDIS_URL`:
   ```
   rediss://default:TU_PASSWORD@redis-12345.c123.us-east-1-1.ec2.redns.redis-cloud.com:12345
   ```
   
   ⚠️ **IMPORTANTE:** Usa `rediss://` (con doble 's') para TLS

---

## 🚂 Configurar en Railway

### Opción A: Desde el Dashboard (Más fácil)

1. Ve a tu proyecto en Railway: https://railway.app/dashboard
2. Haz clic en tu servicio (tempmail-app)
3. Ve a pestaña **"Variables"**
4. Haz clic en **"New Variable"**
5. Agrega:
   ```
   Variable name:  REDIS_URL
   Value:          rediss://default:tu_password@tu-host:puerto
   ```
6. Haz clic en **"Add"**
7. El servicio se redesplegará automáticamente

### Opción B: Desde Railway CLI

```powershell
# Login
railway login

# Listar proyectos
railway list

# Seleccionar proyecto
railway link

# Agregar variable
railway variables set REDIS_URL="rediss://default:password@host:port"

# Ver variables
railway variables
```

---

## 💻 Configurar Localmente

### 1. Crear archivo `.env`

```powershell
# En la raíz del proyecto
Copy-Item .env.example .env
```

### 2. Editar `.env`

```bash
PORT=3001
SMTP_PORT=2525
APP_DOMAIN=tempmail.local

# Pega tu Redis URL aquí
REDIS_URL=rediss://default:TU_PASSWORD@TU_HOST:PUERTO
```

### 3. Reiniciar servidor

```powershell
# Detener servidor
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Iniciar con nuevo Redis
powershell -File start-prod.ps1
```

---

## ✅ Verificar Conexión

### Ver logs del servidor:

Deberías ver:
```
🔄 Conectando a Redis Cloud...
🔌 Conectando a Redis...
✅ Redis Cloud conectado y listo
```

Si ves:
```
❌ Error conectando a Redis: ...
```

**Posibles problemas:**
1. ❌ Password incorrecto
2. ❌ Host incorrecto
3. ❌ No usaste `rediss://` (con doble 's')
4. ❌ Firewall bloqueando puerto

---

## 🧪 Probar Redis

Crea este archivo temporal:

```powershell
# test-redis.js
node -e "
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: { tls: true }
});

client.connect()
  .then(() => {
    console.log('✅ Redis funciona');
    return client.set('test', 'hola');
  })
  .then(() => client.get('test'))
  .then((value) => console.log('Valor:', value))
  .then(() => client.quit())
  .catch(console.error);
"
```

---

## 🔒 Seguridad

### ⚠️ NO SUBAS REDIS_URL A GIT

`.gitignore` ya incluye:
```
.env
.env.local
```

### ✅ Solo en:
- Variables de Railway
- Tu `.env` local (no en Git)

---

## 📊 Monitoreo

### Ver datos en Redis Cloud:

1. Ve al dashboard de Redis Cloud
2. Haz clic en tu database
3. Pestaña **"Data Browser"**
4. Verás todas las keys:
   ```
   account:email1@tiffincrane.com
   account:email2@tiffincrane.com
   ```

### Ver métricas:

- **Memory used:** Cuánto espacio usas
- **Operations/sec:** Velocidad de operaciones
- **Connected clients:** Conexiones activas

---

## 🆓 Límites del Plan Gratuito

✅ **Incluido gratis:**
- 30MB storage (~1000 emails con adjuntos pequeños)
- 30 conexiones concurrentes
- 10,000 comandos/día (más que suficiente)
- SSL/TLS incluido

⚠️ **Límites:**
- Sin replicación (1 sola instancia)
- Sin backups automáticos
- Sin soporte 24/7

💰 **Para escalar ($7/mes):**
- 100MB storage
- Backups automáticos
- 5 databases
- Soporte por email

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
```
❌ No se puede conectar
```
**Solución:** Verifica que el host y puerto sean correctos

### Error: "WRONGPASS"
```
❌ Password incorrecta
```
**Solución:** Copia la password de nuevo desde Redis Cloud

### Error: "self signed certificate"
```
❌ Problema con certificado SSL
```
**Solución:** Asegúrate de usar `rediss://` (doble s)

### Sin errores pero no conecta
```
⚠️ Redis no configurado
```
**Solución:** La variable `REDIS_URL` no está definida

---

## ✅ Beneficios de Redis

**Sin Redis:**
- ❌ Emails se pierden al reiniciar servidor
- ❌ No funciona con múltiples instancias
- ❌ Sin cache entre requests

**Con Redis:**
- ✅ Emails persisten permanentemente
- ✅ Servidor puede reiniciar sin perder datos
- ✅ Mejor rendimiento (cache)
- ✅ Escalable horizontalmente

---

## 🎯 Siguientes Pasos

Una vez configurado Redis:

1. ✅ Los emails persistirán entre reinicios
2. ✅ Puedes escalar a múltiples instancias
3. ✅ Railway puede hacer rolling deploys sin pérdida de datos

**Próxima mejora:** Agregar más proveedores de email (Mailsac, GuerrillaMail)
