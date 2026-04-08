# Backend API — Serverless Functions

Este directorio contiene todas las funciones Serverless para Vercel que sirven al frontend de Discordia.

## Estructura

```
backend/
├── api/
│   └── discordia/
│       ├── db.js                  ← Conexión PostgreSQL centralizada
│       ├── admin-login.js         ← POST /api/discordia/admin-login
│       ├── products.js            ← GET/POST/PUT/DELETE /api/discordia/products
│       ├── catalog.js             ← GET/POST/PUT/DELETE /api/discordia/catalog
│       ├── customers.js           ← GET/POST/PUT/DELETE /api/discordia/customers
│       ├── payments.js            ← POST /api/discordia/payments
│       ├── dashboard.js           ← GET /api/discordia/dashboard
│       ├── sales.js               ← GET/POST /api/discordia/sales
│       ├── ventas.js              ← GET /api/discordia/ventas
│       ├── deudas.js              ← GET /api/discordia/deudas
│       └── discordia-data.js      ← GET /api/discordia/discordia-data
├── vercel.json                    ← Configuración Vercel
└── README.md                      ← Este archivo

## Endpoints Disponibles

### Autenticación
- `POST /api/discordia/admin-login` — Login del admin

### Productos  
- `GET /api/discordia/products` — Listar todos (incluyendo inactivos)
- `POST /api/discordia/products` — Crear producto
- `PUT /api/discordia/products` — Editar producto
- `DELETE /api/discordia/products` — Desactivar producto

### Catálogo Público
- `GET /api/discordia/catalog` — Listar solo activos + metátricas

### Clientes
- `GET /api/discordia/customers` — Listar todos + metátricas
- `POST /api/discordia/customers` — Crear cliente
- `PUT /api/discordia/customers` — Editar cliente
- `DELETE /api/discordia/customers` — Eliminar cliente

### Pagos
- `POST /api/discordia/payments` — Registrar abono a venta

### Dashboard KPIs
- `GET /api/discordia/dashboard` — KPIs: ingresos, deudas, top productos, etc.

### Ventas
- `GET /api/discordia/sales` — Listar ventas (soporta ?status=pending|paid&limit=N)
- `POST /api/discordia/sales` — Crear venta nueva

### Datos Agregados
- `GET /api/discordia/discordia-data` — Catálogo + Ventas + Clientes en una sola llamada

## Variables de Entorno

Requeridas en Vercel (Settings → Environment Variables):

```
DATABASE_URL=postgresql://...  # Neon PostgreSQL connection string
```

## Desarrollo Local

Para probar localmente sin Vercel:

```bash
# Instalar dependencias
npm install

# Usar wrangler (Cloudflare Workers) o similar
# O simplemente hacer fetch a http://localhost:3000/api/discordia/...
```

## Despliegue

```bash
# Build automático en Vercel
# Solo haz git push al mainvercel deploy

# O directamente:
vercel --prod
```

---

**Nota**: El frontend en `discordia/` hace fetch a estos endpoints usando rutas `/api/discordia/...`
