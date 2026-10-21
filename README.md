# 🚀 SkayLabs - Discordia

**Discordia:** Sistema integral de gestión de ventas y catálogo para marcas de belleza y cosméticos.

Platform: **Cloudflare Pages** + **PostgreSQL Hyperdrive** + **Vanilla JavaScript ES Modules**

---

## 📚 Documentación

- **[📖 ARQUITECTURA.md](ARQUITECTURA.md)** — Guía completa de arquitectura, flujos, y comunicación entre módulos
- **[⚡ GUIA_RAPIDA.md](GUIA_RAPIDA.md)** — Referencia rápida de funcionalidades y ubicación de código

---

## 🛍️ Discordia — Catálogo de Belleza & Sistema de Ventas

Sistema frontend + backend para gestionar productos, ventas, clientes y deudas.

### 🎯 Funcionalidades

#### Para Clientes:
- ✨ Catálogo dinámico con búsqueda y filtros
- 🛒 Carrito persistente (localStorage)
- 📱 Diseño responsivo
- 🔒 Autenticación de cliente (opcional)

#### Para Administrador:
- 📦 **Gestión de Productos:** crear, editar, eliminar, actualizar stock
- 💳 **Gestión de Ventas:** crear, editar, eliminar, ver detalles de compras
- 👁️ **Visualizar Compras:** ver qué compró cada cliente (cantidades, precios, totales)
- 📊 **Dashboard:** métricas de ventas, ingresos vs. deudas, top productos
- 💰 **Gestión de Deudas:** rastrear clientes con pagos pendientes
- 🔐 **Sistema de Login:** autenticación segura para admin

### 🚀 Stack Técnico

**Frontend:**
- HTML5
- Vanilla JavaScript (ES Modules)
- Tailwind CSS
- SweetAlert2 (modales de confirmación)

**Backend:**
- Cloudflare Workers (Serverless)
- PostgreSQL vía Hyperdrive
- REST API

**Deployment:**
- Cloudflare Pages (automatizado con git push)

### 📁 Estructura de Carpetas

```
SkayLabs/
├── discordia/           ← Frontend (catálogo + admin panel)
│   ├── index.html       ← Catálogo para clientes
│   ├── admin.html       ← Panel de administrador
│   ├── catalog.js       ← Lógica de productos
│   ├── cart.js          ← Carrito de compras
│   ├── auth.js          ← Autenticación
│   ├── modules/
│   │   ├── ventas.js    ← Gestión de ventas completa
│   │   ├── dashboard.js ← Métricas y resumen
│   │   └── deudas.js    ← Gestión de deudas
│   └── components/
│       ├── filters.js   ← Búsqueda y filtros
│       └── productCard.js ← Componente de tarjeta
│
├── functions/api/discordia/  ← Backend (APIs REST)
│   ├── products.js      ← CRUD de productos
│   ├── sales.js         ← CRUD de ventas
│   ├── dashboard.js     ← Endpoints de métricas
│   └── [id].js files    ← Rutas dinámicas

├── ARQUITECTURA.md      ← Documentación de arquitectura (completa)
└── GUIA_RAPIDA.md       ← Guía de referencia rápida
```

### 🔄 Flujo de Datos Principal

```
Cliente (Browser)
    ↓↑ Fetch HTTP
Frontend: discordia/
    ↓↑ Llamadas a APIs
Backend: functions/api/discordia/
    ↓↑ SQL Queries
PostgreSQL (Hyperdrive)
```

### 🌐 Cómo Funciona

#### 1. Ver Catálogo
```
Usuario abre /discordia/ 
  → GET /api/discordia/products
  → Renderiza grid de productos
  → Búsqueda y filtros en tiempo real
```

#### 2. Crear Venta (Admin)
```
Admin → Panel Admin
  → Click "Nueva Venta"
  → Completa: cliente, productos, cantidad
  → POST /api/discordia/sales
  → Backend inserta en BD
  → Stock se actualiza automáticamente
```

#### 3. Ver Compras de Cliente (Admin)
```
Admin → Tab Ventas
  → Click botón "👁️ Ver" en venta
  → Modal muestra:
    • Nombre cliente, teléfono, canal
    • Todos los productos comprados
    • Cantidad y precio de cada uno
    • Subtotal y total
```

### 🗄️ Base de Datos

**Tablas principales:**
- `products` — Catálogo de productos
- `sales` — Registro de ventas
- `sale_items` — Ítems individuales de cada venta
- `debts` — Deudas de clientes

### 🔧 Iniciar Localmente

```bash
# Instalar dependencias
npm install

# Desarrollo (con emulador Cloudflare)
wrangler dev

# Abre: http://localhost:8787/discordia/
```

### 📞 Rutas API Principales

```
GET    /api/discordia/products         ← Catálogo
POST   /api/discordia/products         ← Crear producto
PUT    /api/discordia/products/:id     ← Editar producto
DELETE /api/discordia/products/:id     ← Eliminar producto

GET    /api/discordia/sales            ← Listar ventas (con items)
POST   /api/discordia/sales            ← Crear venta
PUT    /api/discordia/sales/:id        ← Editar venta
DELETE /api/discordia/sales/:id        ← Eliminar venta

GET    /api/discordia/dashboard        ← Métricas
POST   /api/discordia/admin-login      ← Autenticación
```

---

## 🎨 Diseño
  ```
---

## 💡 Reglas Importantes de Desarrollo

### 1. Event Propagation en Modales
Todos los inputs dentro de modales deben tener `onclick="event.stopPropagation()"` para prevenir que clicks los cierren accidentalmente.

```html
<input type="text" value="..." onclick="event.stopPropagation()" />
```

### 2. Queries Parametrizadas
**Nunca:** concatenar variables en SQL  
**Siempre:** usar placeholders `$1`, `$2`, etc.

```javascript
// ✅ CORRECTO
const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

// ❌ INCORRECTO
const result = await db.query(`SELECT * FROM products WHERE id = ${id}`);
```

### 3. Respuestas JSON Consistentes
Todas las APIs deben devolver:
```javascript
{ ok: true, data: {...} }   // Éxito
{ ok: false, message: "..." }  // Error
```

---

## 🔍 Troubleshooting

### Modal se cierra al escribir
**Solución:** Agregar `onclick="event.stopPropagation()"` a todos los inputs

### Stock no se actualiza
**Solución:** Verificar que POST a `/api/discordia/sales` incluye UPDATE en productos

### Venta no muestra items
**Solución:** Verificar que GET `/api/discordia/sales` incluye `Promise.all()` para traer sale_items

### Base de datos no conecta
**Solución:** Verificar `wrangler.toml` tiene configuración correcta de Hyperdrive ID

---

## 📖 Para Empezar a Desarrollar

1. **Leer:** [ARQUITECTURA.md](ARQUITECTURA.md) — Entender la estructura completa
2. **Consultar:** [GUIA_RAPIDA.md](GUIA_RAPIDA.md) — Ubicación rápida de archivos y funciones
3. **Ubicar:** Usar tablas de referencia para saber dónde está cada funcionalidad
4. **Modificar:** Cambiar en frontend + backend
5. **Probar:** Abrir admin panel y verificar cambios

---

## 🚀 Deployment

```bash
# Instalar dependencias
npm install

# Probar localmente
wrangler dev

# Enviar a producción (auto con git push)
git add .
git commit -m "Cambios"
git push
```

**Live:** https://skaylabs-discordia.pages.dev/

---

## 📁 Estructura del Repositorio Limpio

```
SkayLabs/
├── 📄 README.md                     ← Este archivo
├── 📄 ARQUITECTURA.md               ← Documentación completa
├── 📄 GUIA_RAPIDA.md                ← Referencia rápida
├── 📄 wrangler.toml                 ← Config Cloudflare
├── 📄 package.json                  ← Dependencias
│
├── 📁 discordia/                    ← Frontend (catálogo + admin)
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── app.js, catalog.js, cart.js, auth.js, admin.js
│   ├── modules/
│   │   ├── ventas.js
│   │   ├── dashboard.js
│   │   └── deudas.js
│   ├── components/
│   │   ├── filters.js
│   │   └── productCard.js
│   └── assets/
│
├── 📁 functions/                    ← Backend (APIs Cloudflare)
│   └── api/discordia/
│       ├── products.js
│       ├── sales.js
│       ├── dashboard.js
│       ├── admin-login.js
│       ├── products/[id].js
│       ├── sales/[id].js
│       └── _lib/db.js
│
└── 📁 assets/                       ← Recursos globales
```

---

## 🎓 Estructura de Comunicación Resumida

```
┌─────────────────────────────────────────────────┐
│           CLIENTE (Browser)                     │
│   /discordia/index.html (catálogo)             │
└──────────────────┬──────────────────────────────┘
                   │ app.js router
                   ↓
┌──────────────────────────────────────────────────┐
│      FRONTEND (discordia/)                       │
│                                                  │
│  catalog.js     cart.js     auth.js             │
│  admin.js (orquestador)                         │
│    ├─ modules/ventas.js                         │
│    ├─ modules/dashboard.js                      │
│    ├─ modules/deudas.js                         │
│    └─ components/                               │
│                                                  │
│  localStorage:                                   │
│   - skcCatalog (productos)                      │
│   - skcCart (carrito)                           │
│   - skcAdminToken (autenticación)               │
└──────────────────┬──────────────────────────────┘
                   │ Fetch HTTP
                   ↓
┌──────────────────────────────────────────────────┐
│   BACKEND (Cloudflare Workers)                   │
│   functions/api/discordia/                       │
│                                                  │
│   products.js ────── GET/POST                    │
│   sales.js ────────── GET/POST                   │
│   dashboard.js ────── GET                        │
│   admin-login.js ──── POST                       │
│   [id].js files ────── PUT/DELETE                │
│                                                  │
│   _lib/db.js (Hyperdrive connection)             │
└──────────────────┬──────────────────────────────┘
                   │ SQL
                   ↓
┌──────────────────────────────────────────────────┐
│   PostgreSQL (Hyperdrive)                        │
│                                                  │
│   - products (catálogo)                          │
│   - sales (ventas)                               │
│   - sale_items (ítems de venta)                  │
│   - debts (deudas)                               │
└──────────────────────────────────────────────────┘
```

---

## 👨‍💻 Contribuir

1. Clona el repo
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Realiza cambios
4. Commit: `git commit -m "✨ Descripción"`
5. Push: `git push origin feature/mi-feature`
6. Abre PR

---

## 📞 Información Técnica

- **Platform:** Cloudflare Pages
- **Database:** PostgreSQL vía Hyperdrive (ID: `a0e02ff7de744ed585d9639489bd0435`)
- **Storage:** localStorage (cliente)
- **Auth:** Token JWT en localStorage
- **Deploy:** Git push automático

---

## 📄 Licencia

Proyecto privado de SkayLabs. Todos los derechos reservados.
```

---

## 🛠️ Tecnologías

**Frontend:**
- HTML5 semántico
- CSS3 + Tailwind CSS (CDN)
- JavaScript ES6+ Modules
- No frameworks pesados (vanilla JS)

**Librerías CDN:**
- [Tailwind CSS](https://tailwindcss.com) — Utilidad CSS
- [SweetAlert2](https://sweetalert2.github.io) — Modales y alertas
- [AOS](https://michalsnik.github.io/aos) — Animaciones on-scroll
- [Particles.js](https://vincentgarreau.com/particles.js) — Efectos visuales
- [Chart.js](https://www.chartjs.org) — Gráficos (solo CopCash)
- [Typed.js](https://mattboldt.com/typed.js) — Efecto de tipeo

**Persistencia:**
- `localStorage` — Datos cliente
- [Vercel KV Redis](https://vercel.com/storage/kv) — Backend remoto opcional

**Development:**
- Servidor estático: `python3 -m http.server` o `npx serve`
- Sin build step (assets servidos tal cual)

---

## 🚀 Cómo Empezar

### Requisitos

- Navegador moderno (ES6+, IntersectionObserver)
- Servidor estático (local o en producción)

Abrir navegador:
- **Portafolio:** http://localhost:8000/
- **Discordia:** http://localhost:8000/discordia/
- **CopCash:** http://localhost:8000/copcash/
- **BiECO:** http://localhost:8000/bieco/

---

## 📋 Características Destacadas

✅ **Responsive Design** — Mobile-first, adapta a todos los dispositivos  
✅ **Performance** — Lazy-loading, blur-up effect, minificación de assets  
✅ **Accesibilidad** — Semántica HTML5, contraste, navegación por teclado  
✅ **Modo Oscuro** — Soporte en CopCash, preferencia del usuario  
✅ **Persistencia Local** — localStorage para datos sin sincronización remota  
✅ **API Remota Opcional** — Discordia soporta sincronización con Vercel KV  
✅ **Modular** — Componentes independientes, fácil de extender  
✅ **Sin Dependencias Pesadas** — Vanilla JS + CDN ligeros  

---

## 🔧 Desarrollo

### Estructura de Módulos (Discordia)

```javascript
// Módulo de catálogo
import { renderCatalog, showProductModal } from './catalog.js';

// Módulo de carrito
import { addToCart, cartTotal } from './cart.js';

// Configuración centralizada
import { CONFIG } from './config.js';
```

### Persistencia (localStorage)

**Discordia:**
- `skcCatalog` — Catálogo (editable desde admin)
- `skcCart` — Carrito del usuario
- `skcSales` — Historial de ventas (admin)

**CopCash:**
- `copcash_app_data` — Estado financiero completo

### API Remota (optional)

Endpoint: `/api/skc-data`
- **GET:** Recupera catálogo, ventas y clientes
- **POST:** Guarda datos (con payload JSON)

---

## 📊 Estado del Proyecto

| Componente | Estado | URL |
|-----------|--------|-----|
| Portafolio | ✅ Activo | `/` |
| Discordia | ✅ Producción | `/discordia/` |
| CopCash | ✅ Activo | `/copcash/` |
| BiECO | ✅ Activo | `/bieco/` |
| Payroll Manager | 🔄 En desarrollo | `/payroll-manager/` |

---

## 🌐 Deploy

### Vercel (Recomendado)

```bash
# Conectar repositorio a Vercel
vercel --prod

# O configurar CI/CD automático desde GitHub
```

### Netlify

1. Conectar repositorio
2. Build command: (vacío)
3. Publish directory: `.`

### GitHub Pages

```bash
git push origin main
# Habilitar en Settings → Pages (rama: main)
```

---

## 📝 Contribuir

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/mi-feature`)
3. Commit cambios (`git commit -am 'Agrega mi feature'`)
4. Push a la rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request

**Guías:**
- Mantener estructura modular
- No introducir bundlers sin justificación
- Preferir vanilla JS sobre frameworks
- Documentar cambios significativos

---

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.  
© 2025 **SkayLabs** — Creative Coding & Futuristic Design

---

## 👤 Autor

**Cristhian SkayClouds** — Ingeniero de Sistemas & Desarrollador Web Full Stack

- 🌐 [skaylabs.site](https://skaylabs.site)
- 🐙 [GitHub](https://github.com/cavendanoba)

---

## ❓ FAQ

**¿Puedo usar estos proyectos como template?**  
Sí, son de código abierto. Clona, personaliza y despliega.

**¿Dónde reporto bugs?**  
Abre un [issue en GitHub](https://github.com/cavendanoba/SkayLabs/issues).

**¿Cómo agrego un nuevo proyecto?**  
Crea una carpeta en la raíz, añade `index.html` y módulos, enlaza desde el portafolio.

---

**Última actualización:** Abril 2026  
**Versión:** 1.0.0
