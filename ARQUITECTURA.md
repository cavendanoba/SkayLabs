# 📚 Arquitectura de SkayLabs - Discordia (Sistema de Gestión de Ventas)

## 📋 Tabla de Contenidos
1. [Resumen General](#resumen-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Flujo de Datos](#flujo-de-datos)
4. [Componentes Principales](#componentes-principales)
5. [Comunicación entre Módulos](#comunicación-entre-módulos)
6. [Base de Datos](#base-de-datos)
7. [Rutas API](#rutas-api)
8. [Cómo Modificar Funcionalidades](#cómo-modificar-funcionalidades)

---

## 🎯 Resumen General

**SkayLabs** es un sistema de gestión de ventas y catálogo de productos para Discordia, una marca de cosméticos. 

**Plataforma:** Cloudflare Pages (Workers + Hyperdrive PostgreSQL)  
**Frontend:** Vanilla ES6 módulos, Tailwind CSS  
**Backend:** Cloudflare Workers  
**BD:** PostgreSQL vía Hyperdrive

**Funcionalidades principales:**
- 📦 Catálogo de productos con búsqueda y filtros
- 🛒 Carrito de compras
- 💳 Sistema de ventas con historial
- 📊 Panel de administrador
- 🔐 Autenticación de admin
- 📝 Gestión de deudas
- 🎨 Diseño responsivo con Tailwind

---

## 📁 Estructura de Carpetas

### Raíz del Proyecto

```
SkayLabs/
├── index.html                 ← Landing page (enlaza a Discordia)
├── wrangler.toml              ← Configuración Cloudflare Workers
├── functions/                 ← Backend (APIs)
├── discordia/                 ← Frontend (aplicación cliente)
├── assets/                    ← Recursos globales
├── copcash/                   ← App hermana (NOT USED)
├── bieco/                     ← App hermana (NOT USED)
├── api/                       ← Carpeta duplicada (DEPRECATED)
├── backend/                   ← Código backend viejo (DEPRECATED)
├── scripts/                   ← Scripts de migración (DEPRECATED)
└── trash/                     ← Archivos eliminados
```

---

### 📂 `discordia/` - Frontend Principal

**Propósito:** Todo lo que ve el usuario en el navegador. Aplicación cliente pura con ES módulos.

```
discordia/
│
├── 📄 index.html              ← Punto de entrada de la app
├── 📄 admin.html              ← Panel de administrador
├── 📄 login.html              ← Página de login para admin
│
├── 🎨 style.css               ← Estilos principales
├── 📦 manifest.json           ← PWA manifest (instalable)
│
├── 🚀 app.js                  ← Router y orquestador principal
├── 🔐 auth.js                 ← Sistema de autenticación
├── 🛒 cart.js                 ← Lógica de carrito
├── 📦 catalog.js              ← Renderizado y gestión de catálogo
├── ⚙️  config.js              ← Variables de configuración
├── 📊 products.js             ← Datos de productos por defecto
├── 💬 utils.js                ← Funciones auxiliares
│
├── 🔧 components/
│   ├── filters.js             ← Búsqueda y filtros de catálogo
│   └── productCard.js         ← Componente de tarjeta de producto
│
├── 📋 modules/                ← Módulos del panel admin
│   ├── dashboard.js           ← Dashboard (resumen de ventas)
│   ├── ventas.js              ← Gestión de ventas completa
│   └── deudas.js              ← Gestión de deudas de clientes
│
├── 🎭 admin.js                ← Orquestador del panel admin
│
├── 🌐 sw.js                   ← Service Worker (offline)
│
└── 📁 assets/                 ← Imágenes de productos
    └── *.jpg (imágenes)
```

---

### 🔧 `functions/api/discordia/` - Backend (Cloudflare Workers)

**Propósito:** APIs REST para manejar lógica servidor y base de datos.

```
functions/api/discordia/
│
├── 🔐 admin-login.js          ← POST /api/discordia/admin-login (autenticación)
├── 📊 dashboard.js            ← GET /api/discordia/dashboard (resumen de ventas)
├── 📦 products.js             ← GET/POST /api/discordia/products (catálogo)
├── 💳 payments.js             ← POST /api/discordia/payments (procesar pagos)
├── 💰 sales.js                ← GET/POST /api/discordia/sales (ventas)
│
├── 📁 products/
│   └── [id].js                ← PUT/DELETE /api/discordia/products/:id (editar/eliminar)
│
├── 📁 sales/
│   └── [id].js                ← PUT/DELETE /api/discordia/sales/:id (editar/eliminar)
│
├── 📁 _lib/
│   └── db.js                  ← Helper de conexión PostgreSQL (Hyperdrive)
│
└── 🔗 discordia-data.js       ← Endpoints de datos generales

```

---

### 💾 Base de Datos (PostgreSQL)

**Conexión:** Cloudflare Hyperdrive  
**ID:** `a0e02ff7de744ed585d9639489bd0435`

#### Tablas:

```sql
-- Productos
products (
  id SERIAL PRIMARY KEY,
  name VARCHAR,
  code VARCHAR,
  category VARCHAR,
  price INTEGER,
  stock INTEGER,
  image VARCHAR,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Ventas
sales (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  channel VARCHAR,        -- WhatsApp, Instagram, Efectivo, Nequi, Daviplata, Presencial
  payment_status VARCHAR, -- paid, pending
  total DECIMAL,
  amount_paid DECIMAL,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Ítems de Venta
sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER FOREIGN KEY,
  product_id INTEGER,
  name VARCHAR,
  quantity INTEGER,
  price INTEGER,
  created_at TIMESTAMP
)

-- Deudas
debts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER,
  customer_name VARCHAR,
  amount_due DECIMAL,
  created_at TIMESTAMP
)
```

---

## 🔄 Flujo de Datos

### 1️⃣ Flujo: Ver Catálogo (Cliente)

```
Usuario abre index.html
    ↓
app.js inicia la aplicación
    ↓
catalog.js: renderCatalog('catalog')
    ↓
GET /api/discordia/products (obtiene catálogo)
    ↓
functions/api/discordia/products.js
    ↓
SELECT FROM products WHERE active=true
    ↓
Devuelve JSON con productos
    ↓
catalog.js renderiza tarjetas
    ↓
components/productCard.js crea HTML visual
    ↓
components/filters.js permite buscar/filtrar
    ↓
Usuario ve productos en la pantalla
```

### 2️⃣ Flujo: Agregar al Carrito (Cliente)

```
Usuario clickea "Agregar al Carrito"
    ↓
cart.js: addToCart(productId)
    ↓
Guarda en localStorage bajo clave 'skcCart'
    ↓
Actualiza UI del carrito
    ↓
Cliente ve cantidad en el carrito
```

### 3️⃣ Flujo: Crear Nueva Venta (Admin)

```
Admin clickea "Nueva Venta"
    ↓
ventas.js: showNuevaVentaModal()
    ↓
Admin llena datos (cliente, productos, cantidad, precio)
    ↓
POST /api/discordia/sales
    ↓
functions/api/discordia/sales.js:
  - INSERT INTO sales (customer_name, channel, ...)
  - Para cada producto:
    - INSERT INTO sale_items
    - UPDATE products SET stock = stock - cantidad
    ↓
Devuelve JSON con id de venta
    ↓
ventas.js recarga tabla
    ↓
Admin ve venta en el historial
```

### 4️⃣ Flujo: Ver Compras de una Cliente (Admin)

```
Admin clickea botón "👁️ Ver"
    ↓
ventas.js: showVentaDetailsModal(saleId)
    ↓
Busca en allSales[] el objeto con sale.items[]
    ↓
Modal renderiza cada producto de la venta
    ↓
Muestra:
  - Nombre del producto
  - Cantidad
  - Precio unitario
  - Subtotal por producto
  - Total de la compra
```

### 5️⃣ Flujo: Editar Venta (Admin)

```
Admin clickea "✏️ Editar"
    ↓
ventas.js: showEditVentaModal(container, saleId)
    ↓
Modal se abre con datos actuales
    ↓
Admin puede:
  - Cambiar nombre cliente
  - Cambiar teléfono
  - Cambiar canal (WhatsApp, Instagram, etc)
  - Cambiar estado de pago (Pagado/Pendiente)
  - Cambiar notas
  - Agregar productos (+ cantidad)
  - Eliminar productos
  - Editar precios
    ↓
Clickea "💾 Guardar Cambios"
    ↓
PUT /api/discordia/sales/:id
    ↓
functions/api/discordia/sales/[id].js:
  - UPDATE sales SET customer_name, phone, channel, ...
    ↓
Toast de éxito
    ↓
Tabla se recarga automáticamente
```

### 6️⃣ Flujo: Autenticación Admin

```
Admin va a /discordia/admin.html
    ↓
login.html se muestra
    ↓
Ingresa usuario y contraseña
    ↓
POST /api/discordia/admin-login
    ↓
functions/api/discordia/admin-login.js valida
    ↓
Si válido: genera token y devuelve
    ↓
auth.js almacena en localStorage
    ↓
Redirige a admin.html
    ↓
admin.js verifica token antes de cargar datos
```

---

## 🔗 Comunicación entre Módulos

### Exportación de Funciones (ES Modules)

```javascript
// catalog.js exporta:
export function renderCatalog(containerId) { ... }
export function getCatalog() { ... }
export function showProductModal(productId) { ... }

// cart.js exporta:
export function addToCart(productId, quantity = 1) { ... }
export function removeFromCart(productId) { ... }

// auth.js exporta:
export function setToken(token) { ... }
export function getToken() { ... }
export function isAuthenticated() { ... }

// utils.js exporta:
export function formatCurrency(amount) { ... }
export function toast(message, type) { ... }
```

### Importación en Otros Módulos

```javascript
// En admin.js
import { getCatalog } from './catalog.js';
import { formatCurrency } from './utils.js';
import { renderVentas } from './modules/ventas.js';

// En modules/ventas.js
import { getCatalog } from '../catalog.js';
import { formatCurrency } from '../utils.js';
```

### Comunicación Frontend ↔ Backend

**Método:** Fetch API (HTTPS)

```javascript
// GET: Obtener datos
const res = await fetch('/api/discordia/products');
const json = await res.json();

// POST: Crear datos
const res = await fetch('/api/discordia/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customerName, items: [...] })
});

// PUT: Actualizar datos
const res = await fetch(`/api/discordia/sales/${saleId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customerName, channel, ... })
});

// DELETE: Eliminar datos
const res = await fetch(`/api/discordia/sales/${saleId}`, {
  method: 'DELETE'
});
```

### Almacenamiento Local (localStorage)

```javascript
// Catálogo (default o admin)
localStorage.skcCatalog = JSON.stringify([...]);

// Carrito
localStorage.skcCart = JSON.stringify({
  items: [{ productId, quantity, price }, ...],
  total: 50000
});

// Token de admin
localStorage.skcAdminToken = "abc123...";
```

---

## 🎯 Componentes Principales

### 1. **catalog.js** - Gestión del Catálogo
**Responsabilidad:** Obtener y renderizar productos
- `getCatalog()` - obtiene del localStorage o API
- `renderCatalog(containerId)` - dibuja grid de productos
- `showProductModal(productId)` - abre detalles del producto
- Implementa lazy-loading de imágenes con blur-up

**Comunica con:** 
- `/api/discordia/products` (GET)
- localStorage

### 2. **cart.js** - Sistema de Carrito
**Responsabilidad:** Agregar, quitar, actualizar carrito
- `addToCart(productId, quantity)`
- `removeFromCart(productId)`
- `getCart()` - obtiene carrito actual
- Persiste en localStorage

**Comunica con:**
- localStorage
- catalog.js (para obtener detalles del producto)

### 3. **modules/ventas.js** - Gestión de Ventas (Admin)
**Responsabilidad:** Ver, crear, editar, eliminar ventas
- `renderVentas(container)` - muestra tabla de ventas
- `showNuevaVentaModal(container)` - crear venta
- `showEditVentaModal(container, saleId)` - editar venta
- `showVentaDetailsModal(saleId)` - ver detalles/compras
- `deleteSale(container, saleId)` - eliminar venta

**Comunica con:**
- `/api/discordia/sales` (GET/POST)
- `/api/discordia/sales/:id` (PUT/DELETE)
- `catalog.js` (getCatalog)
- `utils.js` (formatCurrency)

### 4. **modules/dashboard.js** - Panel de Control
**Responsabilidad:** Mostrar resumen de ventas
- Gráficos de ventas por mes/día
- Total cobrado vs pendiente
- Top productos vendidos

**Comunica con:**
- `/api/discordia/dashboard` (GET)
- `/api/discordia/sales` (GET)

### 5. **modules/deudas.js** - Gestión de Deudas
**Responsabilidad:** Rastrear deudas de clientes
- Lista de clientes con deudas
- Montos pendientes
- Marcar como pagado

**Comunica con:**
- `/api/discordia/sales` (GET - filtra pending)
- Calcula deudas desde sale_items

### 6. **admin.js** - Orquestador Admin
**Responsabilidad:** Coordinador general del panel
- Tab navigation (Productos, Ventas, Deudas, Dashboard)
- Modal de nuevo/editar producto
- Llama a modules/* según pestaña activa

**Comunica con:**
- `modules/ventas.js`
- `modules/dashboard.js`
- `modules/deudas.js`
- `/api/discordia/products` (GET/POST/PUT/DELETE)

---

## 🗄️ Base de Datos - Detalles

### Conexión PostgreSQL (functions/_lib/db.js)

```javascript
export function getSql(env) {
  if (!env.HYPERDRIVE) throw new Error('No Hyperdrive binding');
  return postgres(env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
    prepare: false
  });
}
```

**Por qué:** Cloudflare Hyperdrive proporciona conexión segura a PostgreSQL

### Queries Parametrizadas

```javascript
// ✅ CORRECTO - Previene SQL injection
const sql = `SELECT * FROM products WHERE id = $1`;
const result = await db.query(sql, [productId]);

// ❌ INCORRECTO
const sql = `SELECT * FROM products WHERE id = ${productId}`;
```

---

## 🌐 Rutas API

### Autenticación
```
POST /api/discordia/admin-login
  Cuerpo: { usuario: string, contraseña: string }
  Respuesta: { ok: true, token: string }
```

### Productos
```
GET /api/discordia/products
  Parámetros: ?active=true&limit=100
  Respuesta: { ok: true, data: [{ id, name, price, stock, ... }] }

POST /api/discordia/products
  Cuerpo: { name, price, stock, category, image, description }
  Respuesta: { ok: true, data: { id, ... } }

PUT /api/discordia/products/:id
  Cuerpo: { name, price, stock, ... }
  Respuesta: { ok: true }

DELETE /api/discordia/products/:id
  Respuesta: { ok: true } (soft delete - sets active=false)
```

### Ventas
```
GET /api/discordia/sales?limit=100
  Respuesta: { ok: true, data: [{ id, customer_name, total, items: [...], ... }] }

POST /api/discordia/sales
  Cuerpo: { customerName, customerPhone, channel, paymentStatus, items: [...] }
  Respuesta: { ok: true, data: { id, ... } }

PUT /api/discordia/sales/:id
  Cuerpo: { customerName, channel, paymentStatus, notes }
  Respuesta: { ok: true }

DELETE /api/discordia/sales/:id
  Respuesta: { ok: true }
```

### Dashboard
```
GET /api/discordia/dashboard
  Respuesta: { ok: true, data: { totalVentas, cobrado, pendiente, topProducts: [...] } }
```

---

## 🔧 Cómo Modificar Funcionalidades

### Agregar un Nuevo Campo a Productos

1. **BD:** `ALTER TABLE products ADD COLUMN nuevo_campo VARCHAR;`
2. **Backend:** Actualizar `functions/api/discordia/products.js`
3. **Frontend:** Actualizar formulario en `admin.js`
4. **Exportar:** Actualizar queries en ambos lados

### Cambiar Validación de Ventas

1. **Backend:** Editar `functions/api/discordia/sales.js` - función POST
2. **Frontend:** Editar `modules/ventas.js` - validación en `showNuevaVentaModal`
3. **Prueba:** Crear venta de prueba en admin panel

### Agregar Nueva Métrica al Dashboard

1. **Backend:** Agregar query en `functions/api/discordia/dashboard.js`
2. **Frontend:** Editar `modules/dashboard.js` para renderizar nueva métrica
3. **UI:** Actualizar con Tailwind classes

### Agregar Nueva Pestaña al Admin

1. **Crear:** `modules/nuevaPestaña.js`
2. **Exportar:** `export function renderNuevaPestaña(container) { ... }`
3. **Admin:** Agregar botón de pestaña en `admin.js`
4. **Routing:** Agregar case en switch de tabs

---

## 🗑️ Archivos y Carpetas DEPRECATED

**Eliminar los siguientes:**

- ❌ `/api/` - Duplicado de `/functions/api/`
- ❌ `/backend/` - Código viejo de Vercel
- ❌ `/scripts/` - Migraciones antiguas
- ❌ `/bieco/` - App no utilizada
- ❌ `/copcash/` - App no utilizada (aunque hay `/copcash/index.html`)
- ❌ `ANALISIS_VERDADERA_ESTRUCTURA.md` - Obsoleto
- ❌ `BACKEND_ORGANIZATION.md` - Obsoleto
- ❌ `REORGANIZATION_COMPLETE.md` - Obsoleto
- ❌ `VALIDATION_REPORT.md` - Obsoleto
- ❌ `/trash/` - Carpeta de papelera

**Mantener:**

- ✅ `/functions/` - Backend activo
- ✅ `/discordia/` - Frontend activo
- ✅ `/assets/` - Recursos
- ✅ `wrangler.toml` - Config Cloudflare
- ✅ `package.json` - Dependencias
- ✅ `README.md` - Documentación principal

---

## 📚 Resumen de Comunicación

```
CLIENTE (Browser)
    ↓↑ Fetch/ES Modules
Frontend (discordia/)
  - index.html (catálogo)
  - admin.html (panel)
  - app.js (router)
  - catalog.js
  - cart.js
  - modules/ventas.js
  - modules/dashboard.js
  - modules/deudas.js
    ↓↑ HTTP REST
Backend (Cloudflare Workers)
  functions/api/discordia/
    - products.js
    - sales.js
    - dashboard.js
    - admin-login.js
    ↓↑ SQL Queries
Base de Datos (PostgreSQL)
  - products
  - sales
  - sale_items
  - debts
```

---

## 🚀 Deployment (Cloudflare Pages)

```
git push
    ↓
Cloudflare Pages detecta cambios
    ↓
Build: npm install
    ↓
Deploy: Sube /functions y /discordia
    ↓
Live en: https://skaylabs-discordia.pages.dev/
```

**Configuración:** `wrangler.toml`

---

## 📖 Para Comprender el Código

1. **Empieza por:** `discordia/app.js` - punto de entrada
2. **Navega a:** `discordia/catalog.js` - renderizado
3. **Luego:** `functions/api/discordia/products.js` - backend
4. **Finalmente:** Modales en `admin.js` - UI compleja

**Flujo típico de desarrollo:**

```
1. Usuario hace algo en UI
   ↓
2. Evento listeners en módulo JS
   ↓
3. Llamada fetch a /api/discordia/*
   ↓
4. Validación en backend
   ↓
5. Query a BD
   ↓
6. Respuesta JSON
   ↓
7. Frontend renderiza cambio
```

---

## 🎓 Conclusión

Este documento describe toda la arquitectura de SkayLabs. Para cualquier cambio futuro:

1. Identifica **qué módulo** es responsable
2. Entiende **cómo se comunica** con otros
3. Haz el cambio **en todas partes** (frontend + backend)
4. **Prueba** en admin panel
5. **Limpia** archivos no utilizados

**Pregunta clave:** "¿De dónde viene el dato y a dónde va?"

