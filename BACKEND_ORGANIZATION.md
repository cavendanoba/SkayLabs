# Documentación de Organización - SkayLabs

## Visión general

Este repositorio está organizado hoy en dos piezas principales:

- `discordia/`: frontend de Discordia.
- `copcash/`: frontend de CopCash.
- `backend/`: backend serverless y código compartido.

La carpeta `api/` raíz original ya no existe. El backend actual está en `backend/api/` y el deployment utiliza solo ese directorio.

---

## Estructura actual válida para despliegue

### 1) `backend/api/discordia/`
Estas son las funciones serverless de Discordia, expuestas como rutas bajo `/api/discordia/*`.

- `admin-login.js`
  - Ruta: `POST /api/discordia/admin-login`
  - Función: login de administrador.
  - Por qué: centraliza autenticación del panel Discordia.

- `products.js`
  - Ruta: `GET/POST/PUT/DELETE /api/discordia/products`
  - Función: CRUD completo de productos.
  - Por qué: soporta administración de catálogo desde el backend.

- `payments.js`
  - Ruta: `POST /api/discordia/payments`
  - Función: registrar abonos / pagos parciales.
  - Por qué: controla el flujo de pagos y actualiza el estado de ventas.
  - Ruta: `POST /api/discordia/payments`
  - Función: registrar abonos / pagos parciales.
  - Por qué: controla el flujo de pagos y actualiza el estado de ventas.

- `dashboard.js`
  - Ruta: `GET /api/discordia/dashboard`
  - Función: genera KPIs y datos de resumen para el dashboard.
  - Por qué: reduce llamadas al backend y resume información clave.

- `sales.js`
  - Ruta: `GET/POST /api/discordia/sales`
  - Función: listar ventas y crear ventas nuevas.
  - Por qué: alimenta los módulos de ventas y deudas.

- `discordia-data.js`
  - Ruta: `GET /api/discordia/discordia-data`
  - Función: endpoint agregado que devuelve catálogo + ventas + clientes.
  - Por qué: permite carga inicial rápida y reduce llamadas independientes.

### 2) `backend/api/copcash/[...slug].js`

- Ruta: `GET/POST/PUT/DELETE /api/copcash/*`
- Función: catch-all para todas las rutas de CopCash.
- Por qué: CopCash usa muchas rutas REST con estructura dinámica (`/auth`, `/categorias`, `/gastos-fijos`, `/tarjetas/:id/compras`, etc.). El catch-all consolida todo en una sola función serverless.
- Importante: esta función delega en `backend/lib/copcash/`.

### 3) `backend/api/health.js`

- Ruta: `GET /api/health`
- Función: endpoint de verificación básica.
- Por qué: útil para monitoreo y para comprobar que el despliegue está vivo.

### 4) `backend/lib/db.js`

- Función: conexión PostgreSQL compartida mediante `@neondatabase/serverless`.
- Por qué: evita duplicar la conexión en cada endpoint.
- Usado por: todos los endpoints de `backend/api/discordia/` y por los módulos CopCash en `backend/lib/copcash/`.

### 5) `backend/lib/copcash/`

- Contiene los helpers y rutas lógicas de CopCash (`_helpers.js`, `auth/`, `categorias/`, `gastos-fijos/`, `gastos-variables/`, `ingresos-extra/`, `metas/`, `salario.js`, `tarjetas/`).
- No es una función serverless en sí; es código compartido que el catch-all usa.


## Proyectos y carpetas que funcionan

### Discordia

- Carpeta principal: `discordia/`
- Usa backend en: `/api/discordia/*`
- Frontend clave:
  - `discordia/admin.js`
  - `discordia/modules/dashboard.js`
  - `discordia/modules/deudas.js`
  - `discordia/modules/ventas.js`
- Configuración de la API: `discordia/config.js` → `ADMIN_API_PATH: '/api/discordia-data'`
- Por qué funciona: el frontend ahora pide rutas estables `/api/discordia/...`, y el backend `backend/api/discordia/` las provee.

### CopCash

- Carpeta principal: `copcash/`
- Usa backend en: `/api/copcash/*`
- Frontend clave:
  - `copcash/js/models/storage.js`
- Por qué funciona: el frontend mantiene `BASE = '/api/copcash'` y el catch-all en `backend/api/copcash/[...slug].js` responde a todas esas rutas.

### Backend en `backend/`

- Es el único lugar de despliegue real ahora.
- `backend/vercel.json` define las funciones serverless.
- `backend/api/` es donde vive el código expuesto.

---

## Mapeo de rutas reales

| Ruta pública | Archivo/backend | Uso |
|---|---|---|
| `/api/discordia/admin-login` | `backend/api/discordia/admin-login.js` | Auth admin |
| `/api/discordia/products` | `backend/api/discordia/products.js` | Productos CRUD |
| `/api/discordia/payments` | `backend/api/discordia/payments.js` | Abonos / pagos |
| `/api/discordia/dashboard` | `backend/api/discordia/dashboard.js` | KPIs / dashboard |
| `/api/discordia/sales` | `backend/api/discordia/sales.js` | Ventas |
| `/api/discordia/discordia-data` | `backend/api/discordia/discordia-data.js` | Bulk data |
| `/api/copcash/*` | `backend/api/copcash/[...slug].js` | CopCash REST dinámico |
| `/api/health` | `backend/api/health.js` | Health check |

---

## Condición de despliegue en Vercel

### ¿Funciona con los cambios realizados?

Sí: el backend ya está organizado para un deployment válido con **8 funciones serverless**.

### Condiciones

- `backend/vercel.json` es la configuración actual.
- Para que Vercel la use, debes desplegar desde el directorio `backend/` como raíz del proyecto, o mover `backend/vercel.json` al root del repositorio si quieres desplegar desde la raíz.
- El proyecto requiere al menos la variable de entorno `DATABASE_URL`.
- Opcionalmente puedes definir `COPCASH_JWT_SECRET` para CopCash, aunque el código tiene fallback.

### Punto clave

- Si el proyecto se despliega con `backend/` como root de Vercel, sí, el deployment debería funcionar.
- Si Vercel se configura con el repo raíz y no detecta `backend/vercel.json`, entonces no usará la configuración actual.

---

## Recomendación final

- Deploy desde `backend/` en Vercel o mueve `backend/vercel.json` a la raíz.
- Usa `backend/api/` como la fuente de verdad actual para el backend.
