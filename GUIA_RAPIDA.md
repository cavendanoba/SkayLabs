# 🚀 Guía Rápida de Referencia - SkayLabs Discordia

## 📍 Ubicación de Funcionalidades

### Catálogo y Carrito
| Funcionalidad | Archivo | Función |
|---|---|---|
| Ver productos | `discordia/catalog.js` | `renderCatalog('catalog')` |
| Buscar/Filtrar | `discordia/components/filters.js` | Listeners de búsqueda |
| Agregar al carrito | `discordia/cart.js` | `addToCart(productId, qty)` |
| Ver carrito | `discordia/cart.js` | `getCart()` |
| Tarjeta de producto | `discordia/components/productCard.js` | Renderizado visual |

### Panel de Admin (3 pestañas)

#### 🛍️ Productos
| Acción | Archivo | Función |
|---|---|---|
| Ver productos | `discordia/admin.js` | Tab: Productos |
| Nuevo producto | `discordia/admin.js` | `showProductModal()` |
| Editar producto | `discordia/admin.js` | `showProductModal(productId, true)` |
| Eliminar producto | `discordia/admin.js` | `deactivateProduct(productId)` |
| API Backend | `functions/api/discordia/products.js` | GET/POST/PUT/DELETE |
| API Por ID | `functions/api/discordia/products/[id].js` | PUT/DELETE |

#### 💳 Ventas
| Acción | Archivo | Función |
|---|---|---|
| Ver ventas | `discordia/modules/ventas.js` | `renderVentas(container)` |
| Nueva venta | `discordia/modules/ventas.js` | `showNuevaVentaModal(container)` |
| Ver detalles/compras | `discordia/modules/ventas.js` | `showVentaDetailsModal(saleId)` |
| Editar venta | `discordia/modules/ventas.js` | `showEditVentaModal(container, saleId)` |
| Eliminar venta | `discordia/modules/ventas.js` | `deleteSale(container, saleId)` |
| API Backend | `functions/api/discordia/sales.js` | GET/POST |
| API Por ID | `functions/api/discordia/sales/[id].js` | PUT/DELETE |

#### 📊 Dashboard
| Acción | Archivo | Función |
|---|---|---|
| Resumen de ventas | `discordia/modules/dashboard.js` | `renderDashboard(container)` |
| Gráficos | `discordia/modules/dashboard.js` | Chart.js |
| API Backend | `functions/api/discordia/dashboard.js` | GET |

#### 💰 Deudas
| Acción | Archivo | Función |
|---|---|---|
| Ver deudas | `discordia/modules/deudas.js` | `renderDeudas(container)` |
| API Backend | `functions/api/discordia/sales.js` | GET (filtra pending) |

### Autenticación
| Acción | Archivo | Función |
|---|---|---|
| Sistema de auth | `discordia/auth.js` | `setToken(token)`, `getToken()` |
| Login form | `discordia/login.html` | HTML form |
| Backend login | `functions/api/discordia/admin-login.js` | POST endpoint |

---

## 🔄 Flujos Comunes (Copy-Paste Ready)

### ✨ Crear Nueva Venta

**Frontend (modules/ventas.js):**
```javascript
POST /api/discordia/sales
{
  "customerName": "Ana García",
  "customerPhone": "3001234567",
  "channel": "WhatsApp",
  "paymentStatus": "paid",
  "notes": "Regalo de cumpleaños",
  "items": [
    { "productId": 5, "productName": "Labial Rojo", "quantity": 2, "price": 25000 },
    { "productId": 12, "productName": "Base Maquillaje", "quantity": 1, "price": 35000 }
  ]
}
```

**Backend (functions/api/discordia/sales.js):**
```javascript
// INSERT INTO sales (customer_name, channel, ...)
// INSERT INTO sale_items (sale_id, product_id, quantity, price)
// UPDATE products SET stock = stock - quantity
```

### ✏️ Editar Venta

**Frontend (modules/ventas.js):**
```javascript
PUT /api/discordia/sales/42
{
  "customerName": "Ana García",
  "customerPhone": "3001234567",
  "channel": "Instagram",
  "paymentStatus": "paid",
  "notes": "Actualizado"
}
```

**Backend (functions/api/discordia/sales/[id].js):**
```javascript
// UPDATE sales SET customer_name, channel, ... WHERE id = 42
```

### 👁️ Ver Compras de Cliente

```javascript
// En modules/ventas.js
showVentaDetailsModal(saleId) {
  // Busca en allSales[]
  const sale = allSales.find(s => s.id === saleId);
  
  // Renderiza modal con sale.items[]
  // Cada item tiene: name, quantity, price
  
  // Calcula: Subtotal = price * quantity
  // Total = sum de subtotales
}
```

---

## 🗄️ Base de Datos - Queries Útiles

### Ver productos activos
```sql
SELECT * FROM products WHERE active = true ORDER BY created_at DESC;
```

### Ventas de una cliente
```sql
SELECT * FROM sales WHERE customer_name = 'Ana García' 
ORDER BY created_at DESC;
```

### Ítems de una venta
```sql
SELECT * FROM sale_items WHERE sale_id = 42;
```

### Total de ventas pagadas
```sql
SELECT SUM(total) FROM sales WHERE payment_status = 'paid';
```

### Deudas pendientes
```sql
SELECT SUM(total) FROM sales WHERE payment_status = 'pending';
```

### Stock de un producto
```sql
SELECT name, stock FROM products WHERE id = 5;
```

---

## 🔧 Tareas Comunes

### 1️⃣ Agregar nuevo campo a Productos

**Paso 1:** Migración BD
```sql
ALTER TABLE products ADD COLUMN nuevo_campo VARCHAR;
```

**Paso 2:** Backend (functions/api/discordia/products.js)
```javascript
// Agregar en SELECT y INSERT
const { id, name, nuevo_campo, ... } = row;
```

**Paso 3:** Frontend (admin.js)
```javascript
// Agregar input en modal
<input id="modal-nuevo" value="${product?.nuevo_campo||''}" />
```

---

### 2️⃣ Agregar nueva métrica al Dashboard

**Paso 1:** Backend (functions/api/discordia/dashboard.js)
```javascript
const topChannels = await sql`
  SELECT channel, COUNT(*) as count 
  FROM sales 
  GROUP BY channel
`;
```

**Paso 2:** Frontend (modules/dashboard.js)
```javascript
// Renderizar métrica
<div class="bg-white rounded p-4">
  <h3>Canales</h3>
  ${data.topChannels.map(c => `<p>${c.channel}: ${c.count}</p>`)}
</div>
```

---

### 3️⃣ Cambiar validación de Ventas

**Frontend:** modules/ventas.js
```javascript
if (!customerName) {
  alert('El nombre es obligatorio');
  return;
}
```

**Backend:** functions/api/discordia/sales.js
```javascript
if (!body.customerName) {
  return json({ ok: false, message: 'Nombre requerido' }, 400);
}
```

---

### 4️⃣ Agregar nueva búsqueda en Catálogo

En `components/filters.js`:
```javascript
const filtered = catalog.filter(p => 
  p.name.toLowerCase().includes(query) ||
  p.category.toLowerCase().includes(query) ||
  p.description.toLowerCase().includes(query)  // ← Nueva búsqueda
);
```

---

## 🎨 Diseño y Estilos

**CSS Framework:** Tailwind CSS (no CSS compilado)

**Colores principales:**
- Púrpura oscuro: `#6d165a`
- Púrpura medio: `#9d5fa5`
- Rosa: `#a0346e`
- Fondo claro: `#fdf2f7`

**Estructura de Modal:**
```html
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
    <!-- Header: gradient púrpura -->
    <div class="bg-gradient-to-r from-[#6d165a] to-[#9d5fa5]"></div>
    
    <!-- Content: p-6 space-y-6 -->
    <div class="p-6 space-y-6"></div>
    
    <!-- Footer: border-top -->
    <div class="bg-gray-50 px-6 py-4 border-t"></div>
  </div>
</div>
```

---

## 🧠 Reglas Importantes

### 1. Event Propagation
Todos los inputs en modales deben tener:
```html
<input onclick="event.stopPropagation()" ... />
```
**Razón:** Prevenir que clicks en inputs cierren el modal

### 2. Parametrized Queries
**❌ Nunca:**
```javascript
const sql = `SELECT * FROM products WHERE id = ${id}`;
```

**✅ Siempre:**
```javascript
const sql = `SELECT * FROM products WHERE id = $1`;
const result = await db.query(sql, [id]);
```
**Razón:** Prevenir SQL injection

### 3. Respuestas JSON Consistentes
```javascript
return { ok: true, data: {...} };
return { ok: false, message: "Error" };
```

### 4. Async/Await en Modales
```javascript
try {
  const res = await fetch('/api/discordia/sales', { ... });
  const json = await res.json();
  if (!json.ok) throw new Error(json.message);
  
  toast('✓ Guardado');
  renderVentas(container);
} catch (err) {
  alert('Error: ' + err.message);
}
```

---

## 🐛 Debugging

### Ver datos en localStorage
```javascript
console.log(JSON.parse(localStorage.skcCatalog));
console.log(JSON.parse(localStorage.skcCart));
console.log(localStorage.skcAdminToken);
```

### Ver estado de ventas
```javascript
// En modules/ventas.js
console.log(allSales);
```

### Ver API responses
```javascript
const res = await fetch('/api/discordia/sales');
const json = await res.json();
console.log(json);
```

### Limpiar datos locales
```javascript
localStorage.clear();
location.reload();
```

---

## 📦 Estructura de Archivos - Resumen

```
SkayLabs/
├── 📄 index.html ..................... Landing page
├── 📄 ARQUITECTURA.md ............... Este documento extenso
│
├── 📁 discordia/ ..................... Frontend principal
│   ├── 📄 index.html ................ Catálogo cliente
│   ├── 📄 admin.html ................ Panel admin
│   ├── 📄 login.html ................ Login admin
│   │
│   ├── 🎯 app.js .................... Router principal
│   ├── 📦 catalog.js ................ Productos
│   ├── 🛒 cart.js ................... Carrito
│   ├── 🔐 auth.js ................... Autenticación
│   ├── 🎭 admin.js .................. Orquestador admin
│   │
│   ├── 📁 modules/
│   │   ├── dashboard.js ............ Métricas y gráficos
│   │   ├── ventas.js ............... Gestión ventas + visualización
│   │   └── deudas.js ............... Gestión deudas
│   │
│   ├── 📁 components/
│   │   ├── filters.js .............. Búsqueda de productos
│   │   └── productCard.js .......... Tarjeta de producto
│   │
│   └── 📁 assets/ ................... Imágenes de productos
│
├── 📁 functions/api/discordia/ ....... Backend (Cloudflare Workers)
│   ├── 📄 admin-login.js ............ Autenticación
│   ├── 📄 products.js ............... CRUD productos
│   ├── 📄 sales.js .................. CRUD ventas
│   ├── 📄 dashboard.js .............. Métricas
│   │
│   ├── 📁 products/
│   │   └── [id].js .................. Editar/eliminar producto
│   │
│   ├── 📁 sales/
│   │   └── [id].js .................. Editar/eliminar venta
│   │
│   └── 📁 _lib/
│       └── db.js .................... Conexión PostgreSQL
│
├── 📁 assets/ ....................... Recursos globales
├── 📄 wrangler.toml ................. Config Cloudflare
└── 📄 package.json .................. Dependencias
```

---

## 🚀 Deploy

```bash
# Instalar dependencias
npm install

# Desarrollo local
wrangler dev

# Deploy a Cloudflare Pages
git add .
git commit -m "Cambios"
git push

# Live en: https://skaylabs-discordia.pages.dev/
```

---

## 📞 Contacto de Configuraciones

- **Cloudflare Project:** SKC Glow (skcglow)
- **Hyperdrive ID:** a0e02ff7de744ed585d9639489bd0435
- **DB:** PostgreSQL
- **Dominio:** skaylabs-discordia.pages.dev

