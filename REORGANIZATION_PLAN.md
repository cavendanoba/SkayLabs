# Plan Final de Reorganización — SkayLabs

**Fecha:** 5 de Abril, 2026  
**Proyecto:** Restructuración de SkayLabs  
**Status:** EN PROGRESO ✓

---

## 📌 Situación Actual (Problemas Encontrados)

### Estructura Caótica:
```
SkayLabs/
├── api/                              ← ❌ PROBLEMÁTICO
│   ├── db.js                        → Backend ✓
│   ├── admin-login.js               → Backend ✓
│   ├── products.js                  → Backend ✓
│   ├── catalog.js                   → Backend ✓
│   ├── customers.js                 → Backend ✓
│   ├── payments.js                  → Backend ✓
│   ├── discordia-data.js           → Backend ✓
│   ├── dashboard.js                 → ❌ FRONTEND (ERROR DE UBICACIÓN)
│   ├── deudas.js                    → ❌ FRONTEND (ERROR DE UBICACIÓN)
│   └── ventas.js                    → ❌ FRONTEND (ERROR DE UBICACIÓN)
│
├── discordia/                        ← Frontend del proyecto
│   ├── index.html
│   ├── admin.html
│   ├── catalog.js                   → Frontend
│   ├── cart.js                      → Frontend
│   ├── auth.js
│   ├── config.js
│   └── ...
│
├── backend/                          ← ✅ CREADA (NUEVA ESTRUCTURA)
│   ├── api/discordia/               ← ✅ BACKEND APIs (7 archivos ya copiados)
│   │   ├── db.js                    ✓
│   │   ├── admin-login.js           ✓
│   │   ├── products.js              ✓
│   │   ├── catalog.js               ✓
│   │   ├── customers.js             ✓
│   │   ├── payments.js              ✓
│   │   └── discordia-data.js        ✓
│   ├── vercel.json                  ✓
│   └── README.md                    ✓
│
```

---

## ✅ Cambios Completados

1. **Creada estructura `backend/`**
   - ✅ `backend/api/discordia/` (carpeta)
   - ✅ `discordia/modules/` (carpeta)
   - ✅ `discordia/utils/` (carpeta)
   - ✅ `discordia/services/` (carpeta)

2. **Copiados 7 archivos de backend a `backend/api/discordia/`**
   - ✅ db.js
   - ✅ admin-login.js
   - ✅ products.js
   - ✅ catalog.js (versión API, no frontend)
   - ✅ customers.js
   - ✅ payments.js
   - ✅ discordia-data.js

3. **Creada configuración Vercel**
   - ✅ `backend/vercel.json` (configuración de functions)
   - ✅ `backend/README.md` (documentación de endpoints)

---

## 📋 Tareas Pendientes

### Fase 1: Mover Frontend Mal Ubicado
- [ ] Copiar `api/dashboard.js` → `discordia/modules/dashboard.js`
- [ ] Copiar `api/deudas.js` → `discordia/modules/deudas.js`
- [ ] Copiar `api/ventas.js` → `discordia/modules/ventas.js`
- [ ] Crear `backend/api/discordia/sales.js` (endpoint de ventas desde BD)

### Fase 2: Reorganizar discordia/
- [ ] Mover `discordia/admin.js` → `discordia/modules/admin.js`
- [ ] Mover `discordia/catalog.js` → `discordia/modules/catalog.js`
- [ ] Mover `discordia/cart.js` → `discordia/modules/cart.js`
- [ ] Mover `discordia/app.js` → `discordia/app.js` (principal)
- [ ] Copiar componentes a `discordia/components/`
- [ ] Copiar datos a `discordia/data/`

### Fase 3: Actualizar Imports (Crítico)
- [ ] En `discordia/admin.js`: cambiar imports de `api/` a locales
- [ ] En `discordia/app.js`: cambiar rutas de módulos
- [ ] En todos los módulos: actualizar rutas relativas
- [ ] Verificar que `config.js` apunta a `/api/discordia/` (no `/api/`)

### Fase 4: Limpiar y Documentar
- [ ] Eliminar `api/` (o dejar como referencia)
- [ ] Actualizar `README.md` raíz con nueva estructura
- [ ] Crear guía de migración para otros proyectos (Bieco, Copcash)
- [ ] Testear localmente: `python -m http.server 8000`

### Fase 5: Opc ional — Otros Proyectos
- [ ] Evaluar cómo Bieco y Copcash comparten assets
- [ ] Crear symlinks o copias de `assets/` segun necesidad
- [ ] Documentar patrón de compartir recursos

---

## 🏗️ Estructura FINAL Esperada

```
SkayLabs/
├── .github/
│   └── copilot-instructions.md
├── .gitignore
├── .env.example
├── package.json
├── README.md
│
├── index.html                       ← Landing page principal (SkayLabs)
├── style.css                        ← Estilos compartidos (opcional)
├── favicon.ico
│
├── assets/                          ← Compartidos por todos
│   ├── logo-*.png
│   ├── default.png
│   └── ...
│
├── discordia/                       ← Proyecto 1: E-commerce PWA
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── manifest.json
│   ├── style.css
│   ├── sw.js
│   │
│   ├── app.js                       ← Bootstrap principal
│   ├── auth.js                      ← Guard local
│   ├── config.js                    ← Config centralizada
│   │
│   ├── modules/                     ← Módulos de la app
│   │   ├── catalog.js
│   │   ├── cart.js
│   │   ├── admin.js
│   │   ├── dashboard.js              ← MOVIDO de api/
│   │   ├── ventas.js                 ← MOVIDO de api/
│   │   ├── deudas.js                 ← MOVIDO de api/
│   │   ├── customers.js              ← (admin module)
│   │   └── ...
│   │
│   ├── components/                  ← Componentes reutilizables
│   │   ├── productCard.js
│   │   ├── filters.js
│   │   ├── navbar.js
│   │   └── ...
│   │
│   ├── services/                    ← Servicios (opcional)
│   │   ├── api.js                   ← Cliente HTTP centralizado
│   │   ├── storage.js               ← localStorage utils
│   │   └── ...
│   │
│   ├── utils/                       ← Utilidades
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── ...
│   │
│   ├── data/                        ← Datos locales
│   │   ├── products.json
│   │   └── seedData.js
│   │
│   ├── assets/                      ← Locales de discordia
│   │   ├── logo-discordia.png
│   │   └── ...
│   │
│   └── README.md                    ← Documentación local
│
├── bieco/                           ← Proyecto 2 (independiente)
│   ├── index.html
│   └── ...
│
├── copcash/                         ← Proyecto 3 (independiente)
│   ├── index.html
│   └── ...
│
├── backend/                         ← APIs Serverless (Vercel)
│   ├── api/
│   │   └── discordia/
│   │       ├── db.js
│   │       ├── admin-login.js
│   │       ├── products.js
│   │       ├── catalog.js
│   │       ├── customers.js
│   │       ├── payments.js
│   │       ├── sales.js              ← CREAR (endpoints de ventas)
│   │       ├── dashboard.js           ← CREAR (KPIs desde BD)
│   │       └── discordia-data.js
│   │
│   ├── vercel.json
│   └── README.md
│
└── scripts/                         ← Scripts de utilidad
    └── migrate-products.js
```

---

## 🔧 Cambios de Imports

### Antes (api/ global):
```javascript
// En discordia/admin.js
import { renderDashboard } from '../api/dashboard.js';  // ❌ INCORRECTO
```

### Después (módulos locales):
```javascript
// En discordia/admin.js
import { renderDashboard } from './modules/dashboard.js';  // ✅ CORRECTO
```

### Fetch a Backend:
```javascript
// Antes: /api/discordia → Vercel en producción
// Ahora: /api/discordia → Mismo servidor (dev) o Vercel (prod)

// En cualquier módulo:
const res = await fetch('/api/discordia/dashboard');  // ✅ Vercel URL
```

---

## 📌 Endpoint Mapping

### Frontend Requests → Backend URLs

```
LOCAL DEVELOPMENT:
- Módulo hace: fetch('/api/discordia/dashboard')
- Resoluciones a: http://localhost:8000/api/discordia/dashboard 
- (NO funcionan localmente sin proxy, pero sí en Vercel)

VERCEL PRODUCTION:
- Base: https://skaylabs.vercel.app/
- Módulo es: fetch('/api/discordia/dashboard')
- Resuelve a: https://skaylabs.vercel.app/api/discordia/dashboard
- Vercel ruta automáticamente a: backend/api/discordia/dashboard.js
```

---

## 🧪 Testing Post-Migración

1. **Verificar estructura local:**
   ```bash
   tree -L 3 backend/ discordia/
   ```

2. **Testear frontend localmente (sin APIs):**
   ```bash
   cd discordia
   python -m http.server 8000
   # Visita: http://localhost:8000/index.html
   # Nota: APIs no funcionarán, pero el UI debe cargar
   ```

3. **Testear con mock endpoints:**
   - [ ] Crear `discordia/services/api.js` con mocks para desarrollo
   - [ ] Las APIs reales funcionarán en Vercel

4. **Verificar imports:**
   ```bash
   grep -r "from.*api/" discordia/  # Estaría mal
   grep -r "/api/discordia" discordia/  # Está bien
   ```

---

## 📚 Documentación Generada

- ✅ `backend/README.md` — Endpoints disponibles
- ✅ `PROJECT_STRUCTURE_AUDIT.md` — Este documento
- ⏳ `discordia/README.md` — Estructura local de Discordia
- ⏳ `MIGRATION_GUIDE.md` — Guía para migrar otros proyectos

---

## Notas Importantes

1. **`api/` folder:** Mantener temporalmente como referencia. Deletear después de verificar que todo funciona.

2. **Rutas relativas:** Todos los imports en `discordia/` deben ser relativos (`./modules/...`,`../assets/...`) excepto para fetch a `/api/...`.

3. **Desarrollo sin APIs:** Criar `discordia/services/api-mock.js` para desarrollo local sin Vercel.

4. **Config centralizada:** Todo en `discordia/config.js`. No duplicar configuración.

5. **Assets compartidos:** Por ahora en `assets/`. Si Bieco/Copcash necesitan, crear symlinks o copiar.

---

**Próximo Paso:** Ejecutar Fase 1 (mover frontend files).
