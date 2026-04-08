# Panel Admin — Guía de Setup

## ⚠️ Primeros pasos

El panel admin requiere:
1. **Base de datos Neon** (PostgreSQL) configurada
2. **Usuario admin** creado en la tabla `admin_users`
3. **Backend corriendo** (para desarrollo local)

---

## 1️⃣ Crear usuario admin

Desde la raíz del proyecto:

```bash
node scripts/create-admin.js
```

**Credenciales por defecto:**
- Usuario: `dvdadmon`
- Contraseña: `Minuto2025+-`

⚠️ Cámbianas inmediatamente después del primer login.

---

## 2️⃣ Correr el backend en desarrollo

### Opción A: Con Node.js local

```bash
cd backend
npm install  # Si es primera vez
npm run dev  # O el script que tengas configurado
```

El backend debe correr en `http://localhost:5000`

### Opción B: Con Vercel CLI

```bash
vercel dev
```

---

## 3️⃣ Acceder al panel

1. Ve a `http://localhost:8000/discordia/login.html` (o tu puerto)
2. Ingresa credenciales:
   - Usuario: `dvdadmon`
   - Contraseña: `Minuto2025+-`
3. Accede desde el footer de la tienda (pequeño enlace `admin`)

---

## 🔧 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Error de conexión" | Backend no está corriendo en `localhost:5000` |
| "Credenciales inválidas" | Usuario no existe o BD no está conectada |
| CORS bloqueado | Verifica que el backend tenga headers CORS correctos |
| No puedes crear usuario | Verifica `DATABASE_URL` en `.env` |

---

## 🌐 En producción (Vercel)

- El backend + frontend se despliegan juntos
- Las rutas `/api/*` se sirven automáticamente
- El login usa rutas relativas (sin `localhost:5000`)
- Asegúrate de que `DATABASE_URL` esté en Variables de Vercel
