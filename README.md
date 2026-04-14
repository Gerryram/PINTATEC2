# PINTATEC 🎨 v2.0

App móvil con IA para cotización de pintura residencial en Tijuana.

## Features
- 📸 **Cotización con IA** — sube foto, obtén presupuesto en segundos
- 🎨 **Catálogo de pinturas** — Basic / Pro / Premium
- 📅 **Agendar visita** — citas con fecha, hora y datos de contacto
- 💬 **WhatsApp Business** — confirmación directa
- 📧 **Notificaciones por email** — al dueño cuando llega una cita
- 🗂️ **Panel Admin** — ver y gestionar todas las citas en /admin
- 📲 **PWA instalable** — se instala en el celular como app nativa

## Stack
- Next.js 14, React 18
- Anthropic Claude (visión + cotización)
- Vercel KV (base de datos Redis)
- Resend (emails transaccionales)

---

## Deploy en Vercel (paso a paso)

### 1. GitHub
```bash
git init && git add . && git commit -m "PINTATEC v2"
git remote add origin https://github.com/TU_USUARIO/pintatec.git
git push -u origin main
```

### 2. Vercel — Importar proyecto
- vercel.com → New Project → importa el repo
- Framework: Next.js (auto-detectado)

### 3. Vercel KV — Base de datos
- En Vercel Dashboard → Storage → Create → KV Store
- Nómbrala `pintatec-db`
- Haz click en "Connect to Project" → selecciona tu proyecto
- Las variables KV_* se agregan automáticamente ✅

### 4. Variables de entorno en Vercel
Settings → Environment Variables → agregar:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Tu clave de console.anthropic.com |
| `RESEND_API_KEY` | Tu clave de resend.com (gratis) |
| `ADMIN_EMAIL` | Tu email para recibir notificaciones |
| `ADMIN_SECRET` | Contraseña para entrar a /admin |

### 5. Deploy 🚀
Click **Deploy** — listo en ~2 minutos.

---

## Dominio personalizado (pintatec.mx)

1. Compra el dominio en Namecheap / GoDaddy / NIC.mx
2. En Vercel → Settings → Domains → Add Domain → `pintatec.mx`
3. Vercel te dará un registro DNS (tipo A o CNAME)
4. Agrégalo en el panel de tu registrador de dominio
5. En ~10 min tiene HTTPS automático ✅

---

## Panel Admin

URL: `https://tu-app.vercel.app/admin`

- Login con `ADMIN_SECRET`
- Ver todas las citas en tiempo real
- Filtrar por estado: pendiente / confirmada / completada
- Botón directo a WhatsApp del cliente

---

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local con tus claves reales
npm run dev
# http://localhost:3000
```

---

## Personalizar

En `pages/index.js`:
- Línea ~30: `WA_NUMBER` → tu número WhatsApp Business
- Header: busca `664 123 4567` y reemplaza
- `pages/api/appointments.js` línea ~60: cambia el `from:` email por tu dominio
