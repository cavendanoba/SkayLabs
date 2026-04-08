# AUDITORÍA DE ESTRUCTURA — SKayLabs / Discordia

## 📊 Estado Actual (Problemas Identificados)

### ❌ Problemas

1. **Separación innecesaria: `api/` vs `discordia/`**
   - `api/` contiene Vercel Serverless Functions (backend remoto)
   - `discordia/` es el frontend que hace fetch a `/api/`
   - Localmente los endpoints no funcionan (son functions Vercel)
   - Confusión: hay `api/catalog.js` Y `discordia/catalog.js` (DUPLICADO)

2. **Rutas de importación inconsistentes**
   - `discordia/catalog.js` importa de `./products.js` (local)
   - `api/products.js` espera `POST /api/products` (endpoint)
   - No hay claridad sobre dónde vive cada cosa

3. **Arquivos duplicados / conflictivos**
   ```
   api/catalog.js          (Vercel Serverless)
   api/customers.js        (Vercel Serverless)
   api/dashboard.js        (Vercel Serverless)
   api/deudas.js           (Vercel Serverless)
   api/products.js         (Vercel Serverless)
   api/ventas.js           (Vercel Serverless)
   
   discordia/catalog.js    (Frontend local - diferente)
   ```

4. **Configuración dispersa**
   - `discordia/config.js` tiene rutas a `/api/` pero localmente no existen
   - `discordia/auth.js` es solo localStorage (sin backend)
   - `api/admin-login.js` existe pero no se usa

5. **Proyecto sin estructura clara**
   ```
   SkayLabs/
   ├── api/                    ← Backend Vercel (no usado localmente)
   ├── discordia/              ← Frontend (lo que sí se usa)
   ├── assets/                 ← Mezclados sin ownership claro
   ├── bieco/                  ← Otros proyectos
   ├── copcash/                ← Otros proyectos
   └── scripts/                ← Migraciones
   ```

---

## ✅ Estructura Recomendada

### Opción A: **Monorepo Limpio** (RECOMENDADO)

```
SkayLabs/
├── .github/
│   └── copilot-instructions.md
├── .env
├── .gitignore
├── package.json
├── README.md
│
├── frontend/                 ← Renombrar "discordia" (si es genérico)
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── app.js                ← Bootstrap + inicialización
│   ├── auth.js               ← Guard de autenticación local
│   ├── config.js             ← Configuración centralizada
│   │
│   ├── styles/
│   │   ├── style.css
│   │   ├── admin-styles.css  (opcional)
│   │   └── ...
│   │
│   ├── modules/              ← Funcionalidad reutilizable
│   │   ├── catalog.js        ← Renderización de catálogo
│   │   ├── cart.js           ← Lógica del carrito
│   │   ├── filters.js        ← Filtros de productos
│   │   ├── dashboard.js      ← Dashboard admin (solo UI)
│   │   ├── ventas.js         ← Ventas admin (solo UI)
│   │   ├── deudas.js         ← Deudas admin (solo UI)
│   │   ├── customers.js      ← Clientes admin (solo UI)
│   │   └── ...
│   │
│   ├── components/           ← Componentes reutilizables
│   │   ├── productCard.js
│   │   ├── filters.js
│   │   └── ...
│   │
│   ├── data/
│   │   ├── products.json     ← Datos seed locales
│   │   └── default.json      ← Otros datos
│   │
│   ├── assets/
│   │   ├── logo-discordia.png
│   │   ├── default.png
│   │   └── ...
│   │
│   ├── api/                  ← Mock/Stub endpoints (DEV)
│   │   └── mock-handlers.js  ← Simulan respuestas Vercel
│   │
│   └── sw.js                 ← Service Worker (PWA)
│
├── backend/                  ← Vercel Serverless (si aplica)
│   ├── api/
│   │   ├── dashboard.js      ← Endpoint GET /api/dashboard
│   │   ├── products.js       ← Endpoint CRUD /api/products
│   │   ├── ventas.js         ← Endpoint CRUD /api/ventas
│   │   ├── deudas.js         ← Endpoint CRUD /api/deudas
│   │   ├── customers.js      ← Endpoint CRUD /api/customers
│   │   ├── admin-login.js    ← Endpoint POST /api/admin-login
│   │   ├── db.js             ← Conexión PostgreSQL
│   │   └── ...
│   ├── vercel.json           ← Config Vercel
│   └── .env.example
│
└── otros-proyectos/
    ├── bieco/
    ├── copcash/
    └── ...
```

### Opción B: **Si todo debe estar dentro de discordia/**

```
SkayLabs/
├── discordia/
│   ├── frontend/             ← Todo lo visual
│   │   ├── index.html
│   │   ├── admin.html
│   │   ├── login.html
│   │   ├── style.css
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── modules/
│   │   ├── components/
│   │   ├── data/
│   │   ├── assets/
│   │   └── sw.js
│   │
│   └── backend/              ← Serverless (para Vercel)
│       ├── api/
│       │   ├── dashboard.js
│       │   ├── products.js
│       │   └── ...
│       └── vercel.json
```

---

## 🔧 Plan de Acción Recomendado

### Fase 1: Análisis (COMPLETADO ✅)
- [x] Identificar archivos duplicados
- [x] Mapear dependencias
- [x] Detectar conflictos de rutas

### Fase 2: Preparación
- [ ] Crear estructura nueva
- [ ] Copiar archivos con rutas corregidas
- [ ] Actualizar imports

### Fase 3: Consolidación
- [ ] Eliminar duplicados
- [ ] Actualizar `config.js` con nuevas rutas
- [ ] Testear localmente

### Fase 4: Limpieza
- [ ] Mover `api/` a `backend/` (si es para Vercel)
- [ ] Actualizar `.gitignore` y `.env`
- [ ] Documentar estructura en README

---

## 📋 Archivos a Mover/Actualizar

### De `api/` → `backend/api/`
- ✓ admin-login.js
- ✓ catalog.js (RENOMBRAR a catalog-api.js para evitar conflicto)
- ✓ customers.js
- ✓ dashboard.js (RENOMBRAR a dashboard-api.js)
- ✓ db.js
- ✓ deudas.js
- ✓ discordia-data.js
- ✓ payments.js
- ✓ products.js
- ✓ ventas.js

### En `discordia/` → `frontend/modules/`
- ✓ catalog.js (MANTENER con ese nombre)
- ✓ dashboard.js (UI, no API)
- ✓ deudas.js (UI)
- ✓ ventas.js (UI)
- ✓ customers.js (UI)

### Se quedan en `discordia/` (o `frontend/`)
- ✓ index.html
- ✓ admin.html
- ✓ login.html
- ✓ app.js
- ✓ admin.js
- ✓ auth.js
- ✓ cart.js
- ✓ config.js
- ✓ style.css
- ✓ sw.js (PWA)

---

## 🎯 Próximos Pasos

Necesito tu confirmación sobre:

1. **¿Cuál estructura prefieres?**
   - Opción A: `frontend/` y `backend/` separados (más limpio para monorepo)
   - Opción B: Todo dentro de `discordia/` pero organizado

2. **¿Es `api/` actual para Vercel?**
   - Si sí → Moverlo a `backend/` y documentar cómo deployar
   - Si no → Consolidarlo todo en `frontend/modules/`

3. **¿Qué hacemos con `bieco/` y `copcash/`?**
   - ¿Son proyectos independientes?
   - ¿Deberían tener su propia carpeta raíz?

---

