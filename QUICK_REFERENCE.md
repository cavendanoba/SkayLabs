# 🎯 Quick Reference Card - SkayLabs Discordia

**Guía de bolsillo para consultaciones rápidas durante el desarrollo**

---

## 📂 Carpetas Principales

```
discordia/          ← FRONTEND (lo que ve el usuario)
├── index.html      ← Catálogo cliente
├── admin.html      ← Panel administrador
└── modules/
    ├── ventas.js   ← Gestión de ventas (AQUÍ: Ver compras, crear, editar)
    ├── dashboard.js ← Métricas
    └── deudas.js   ← Deudas de clientes

functions/          ← BACKEND (Cloudflare Workers)
└── api/discordia/
    ├── products.js   ← API productos (GET/POST)
    ├── sales.js      ← API ventas (GET/POST)
    ├── products/[id].js ← Editar/eliminar producto (PUT/DELETE)
    ├── sales/[id].js    ← Editar/eliminar venta (PUT/DELETE)
    └── _lib/db.js    ← Conexión PostgreSQL
```

---

## 🔑 Funciones Clave

### Catálogo
```javascript
renderCatalog('catalog')        // Mostrar productos
getCatalog()                    // Obtener lista de productos
showProductModal(productId)     // Ver detalles del producto
```

### Carrito
```javascript
addToCart(productId, qty)       // Agregar al carrito
removeFromCart(productId)       // Quitar del carrito
getCart()                       // Obtener carrito actual
```

### Ventas (Admin)
```javascript
renderVentas(container)              // Listar todas las ventas
showNuevaVentaModal(container)       // Crear nueva venta
showEditVentaModal(container, id)    // Editar venta existente
showVentaDetailsModal(saleId)        // 👁️ VER COMPRAS (NUEVA)
deleteSale(container, saleId)        // Eliminar venta
```

### Auth
```javascript
setToken(token)                 // Guardar token
getToken()                      // Obtener token
isAuthenticated()               // Verificar si está autenticado
```

---

## 🌐 Endpoints API

### Productos
```
GET    /api/discordia/products
POST   /api/discordia/products
PUT    /api/discordia/products/:id
DELETE /api/discordia/products/:id
```

### Ventas
```
GET    /api/discordia/sales?limit=100
POST   /api/discordia/sales
PUT    /api/discordia/sales/:id
DELETE /api/discordia/sales/:id
```

### Otros
```
POST   /api/discordia/admin-login
GET    /api/discordia/dashboard
```

---

## 📋 Estructura de Datos

### Producto
```javascript
{
  id: 1,
  name: "Labial Rojo",
  price: 25000,
  stock: 50,
  category: "Maquillaje",
  image: "assets/labial-rojo.jpg",
  description: "Labial rojo pasión",
  active: true
}
```

### Venta
```javascript
{
  id: 42,
  customer_name: "Ana García",
  customer_phone: "3001234567",
  channel: "WhatsApp",
  payment_status: "paid",
  total: 75000,
  notes: "Regalo",
  items: [
    { name: "Labial", quantity: 2, price: 25000 },
    { name: "Base", quantity: 1, price: 35000 }
  ],
  created_at: "2026-08-01T10:30:00Z"
}
```

---

## 🧠 Flujo Típico de Desarrollo

```
1. Usuario hace algo en el UI
   ↓
2. Event listener captura acción
   ↓
3. Función JavaScript se ejecuta
   ↓
4. Fetch HTTP a /api/discordia/*
   ↓
5. Backend valida y accede a BD
   ↓
6. Devuelve JSON { ok: true, data: ... }
   ↓
7. Frontend renderiza cambio
   ↓
8. Usuario ve resultado
```

---

## ✅ Checklist: Hacer Cambios

- [ ] Identificar módulo afectado (frontend o backend)
- [ ] Hacer cambio en frontend (`discordia/`)
- [ ] Hacer cambio en backend (`functions/api/`)
- [ ] Agregar `onclick="event.stopPropagation()"` si es input
- [ ] Usar queries parametrizadas (`$1`, `$2`)
- [ ] Devolver respuesta con `{ ok: true/false, data/message }`
- [ ] Probar en admin panel
- [ ] Actualizar GUIA_RAPIDA.md si es necesario
- [ ] Hacer commit descriptivo

---

## 🐛 Debugging Rápido

### Ver datos en localStorage
```javascript
console.log(JSON.parse(localStorage.skcCatalog))
console.log(JSON.parse(localStorage.skcCart))
console.log(localStorage.skcAdminToken)
```

### Ver respuesta de API
```javascript
const res = await fetch('/api/discordia/sales');
const json = await res.json();
console.log(json);
```

### Limpiar todo y empezar de nuevo
```javascript
localStorage.clear();
location.reload();
```

### Ver todas las ventas en memoria
```javascript
// En la consola del admin panel
console.log(allSales)
```

---

## 🎨 Colores y Estilos

```
Púrpura oscuro:  #6d165a   → Headers, texto importante
Púrpura medio:   #9d5fa5   → Gradientes, acciones
Rosa:            #a0346e   → Números, totales
Fondo claro:     #fdf2f7   → Fondo de secciones
```

### Estructura Modal
```html
<div class="fixed inset-0 bg-black/50 z-50">      <!-- Overlay -->
  <div class="bg-white rounded-2xl max-w-2xl">   <!-- Modal -->
    
    <!-- Header: Gradient púrpura -->
    <div class="bg-gradient-to-r from-[#6d165a] to-[#9d5fa5]">
      <h2>Título</h2>
    </div>

    <!-- Content: p-6 space-y-6 -->
    <div class="p-6 space-y-6" onclick="event.stopPropagation()">
      <input onclick="event.stopPropagation()" />
    </div>

    <!-- Footer: Border top gris -->
    <div class="bg-gray-50 border-t">
      <button>Cerrar</button>
    </div>
  </div>
</div>
```

---

## ⚡ Atajos Útiles

### Crear nueva venta rápidamente
1. Admin panel → Ventas → Nueva Venta
2. Completa: cliente, productos, cantidad
3. Click Guardar → POST /api/discordia/sales
4. Tabla se recarga automáticamente

### Ver compras de cliente
1. Admin panel → Ventas → Click "👁️ Ver"
2. Modal muestra todos los productos comprados
3. Información: cantidad, precio, subtotal
4. Total al final

### Editar venta existente
1. Admin panel → Ventas → Click "✏️ Editar"
2. Puedes cambiar: cliente, canal, estado pago, productos
3. Agregar productos con "➕ Agregar"
4. Click "💾 Guardar Cambios"

### Deletear venta
1. Admin panel → Ventas → Click "🗑️ Eliminar"
2. Confirmar con SweetAlert
3. Tabla se recarga automáticamente

---

## 🔒 Reglas de Oro

| Regla | Razón | Ejemplo |
|-------|-------|---------|
| Queries parametrizadas | Prevenir SQL injection | `$1, $2` no `${var}` |
| event.stopPropagation() | Prevenir cierre de modales | Todo input en modal |
| Validación frontend + backend | Seguridad y UX | Nombre requerido dos veces |
| Respuestas JSON consistentes | Facilitar debug | `{ ok: true, data: ... }` |
| Cambios en ambos lados | No romper app | Cambiar frontend Y backend |

---

## 📞 Información Técnica Rápida

```
Platform:        Cloudflare Pages
Frontend:        Vanilla JS + ES Modules + Tailwind
Backend:         Cloudflare Workers
BD:              PostgreSQL (Hyperdrive ID: a0e02...)
Storage:         localStorage (cliente)
Auth:            Token JWT en localStorage
Deploy:          git push automático
Live URL:        https://skaylabs-discordia.pages.dev/
```

---

## 🚀 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Desarrollo local
wrangler dev
# Abre: http://localhost:8787/discordia/

# Deploy (automático con git)
git add .
git commit -m "✨ Descripción del cambio"
git push

# Limpiar y reinstalar
rm -rf node_modules
npm install
```

---

## 📍 "¿Dónde está...?"

| Qué | Dónde |
|-----|-------|
| Catálogo de productos | `discordia/catalog.js` |
| Carrito de compras | `discordia/cart.js` |
| Autenticación | `discordia/auth.js` |
| Admin panel | `discordia/admin.js` |
| Gestión de ventas | `discordia/modules/ventas.js` |
| Dashboard/Métricas | `discordia/modules/dashboard.js` |
| Deudas de clientes | `discordia/modules/deudas.js` |
| Búsqueda y filtros | `discordia/components/filters.js` |
| API Productos | `functions/api/discordia/products.js` |
| API Ventas | `functions/api/discordia/sales.js` |
| API Dashboard | `functions/api/discordia/dashboard.js` |
| API Login | `functions/api/discordia/admin-login.js` |
| Conexión BD | `functions/api/discordia/_lib/db.js` |

---

## 🎓 Leer Más

- 📖 [ARQUITECTURA.md](ARQUITECTURA.md) - Documentación completa
- ⚡ [GUIA_RAPIDA.md](GUIA_RAPIDA.md) - Referencia rápida
- 📋 [INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md) - Índice de docs
- 📄 [README.md](README.md) - Introducción al proyecto

---

**Última actualización:** 2026-08-01  
**Estado del proyecto:** ✅ Documentado y limpio

