# Backend API — Serverless Functions

Este directorio contiene todas las funciones Serverless para Vercel que sirven al frontend de Discordia.

## Estructura

```
backend/
├── api/
│   ├── copcash/
│   │   └── [...slug].js            ← Catch-all para CopCash API
│   ├── discordia/
│   │   ├── admin-login.js         ← POST /api/discordia/admin-login
│   │   ├── products.js            ← GET/POST/PUT/DELETE /api/discordia/products
│   │   ├── payments.js            ← POST /api/discordia/payments
│   │   ├── dashboard.js           ← GET /api/discordia/dashboard
│   │   ├── sales.js               ← GET/POST /api/discordia/sales
│   │   └── discordia-data.js      ← GET /api/discordia/discordia-data
│   └── health.js                  ← GET /api/health
├── lib/
│   └── copcash/                   ← Código reusable y helpers de CopCash
│       ├── _helpers.js
│       ├── auth/
│       ├── categorias/
│       ├── gastos-fijos/
│       ├── gastos-variables/
│       ├── ingresos-extra/
│       ├── metas/
│       ├── salario.js
│       ├── tarjetas/
│       └── schema.sql
├── vercel.json                    ← Configuración Vercel
└── README.md                      ← Este archivo

NOTA: La carpeta raíz `api/` ya no existe. Las rutas actuales de Vercel usan `backend/api/`.

## Endpoints Disponibles

### Autenticación
- `POST /api/discordia/admin-login` — Login del admin

### Productos  
- `GET /api/discordia/products` — Listar todos (incluyendo inactivos)
- `POST /api/discordia/products` — Crear producto
- `PUT /api/discordia/products` — Editar producto
- `DELETE /api/discordia/products` — Desactivar producto

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
