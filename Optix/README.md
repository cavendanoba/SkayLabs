# 🏥 OPTIX - Gestión Clínica Oftalmológica

**Optix** es un SaaS profesional para consultorios privados de oftalmología. Sistema integral de gestión clínica, citas, historia médica, diagnósticos CIE-10, caja y transacciones.

## 📋 Características

- ✅ **Gestión de Pacientes**: Registro, búsqueda, filtros, importación
- ✅ **Agenda Inteligente**: Vista semana/día/mes, validación de conflictos
- ✅ **Historia Clínica**: Formulario completo con oftalmología OD/OI
- ✅ **Diagnósticos CIE-10**: Base de datos de diagnósticos oftalmológicos
- ✅ **Caja y Transacciones**: Ingresos, gastos, reportes
- ✅ **Dashboard Operativo**: KPIs, actividad en tiempo real
- ✅ **Autenticación JWT**: Segura con refresh token rotativo
- ✅ **Tema Dark/Light**: Respeta preferencias del usuario
- ✅ **Responsive Design**: Optimizado para desktop y mobile
- ✅ **UI en Español**: 100% en idioma español

## 🛠️ Stack Técnico

### Backend
- **Node.js 20** + **Express 5**
- **Prisma 5** (ORM)
- **PostgreSQL 16**
- **JWT** + **bcryptjs**
- **Zod** (validación)
- **Rate Limiting**

### Frontend
- **Vanilla JavaScript ES2022+**
- **Vite 5** (bundler)
- **Bootstrap 5** (base responsiva)
- **CSS Modular** (tema Optix)
- **Chart.js** (gráficas)
- **FullCalendar** (agenda)

## 📁 Estructura del Proyecto

```
optix/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Node.js 20+
- Docker & Docker Compose
- Git

### 1️⃣ Clonar y Preparar Entorno

```bash
cd d:\Documentos\Optix

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2️⃣ Iniciar Servicios (Docker)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Esperar a que PostgreSQL esté listo (~10 segundos)
```

### 3️⃣ Configurar Base de Datos

```bash
cd backend

# Crear migraciones
npm run migrate

# Cargar datos de demo (usuarios, pacientes, citas, etc.)
npm run seed

# Opcional: Ver Prisma Studio
npm run studio
```

### 4️⃣ Iniciar Servidores

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Puerto: http://localhost:3001
# Health: http://localhost:3001/health
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Puerto: http://localhost:5173
# Se abrirá automáticamente
```

## 👤 Usuarios Demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@optix.co | Admin2026! | Admin |
| medico@optix.co | Doctor2026! | Médico |
| recepcion@optix.co | Recep2026! | Recepcionista |

## 📚 API Endpoints

### Auth
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Patients
```
GET    /api/v1/patients
POST   /api/v1/patients
GET    /api/v1/patients/:id
PUT    /api/v1/patients/:id
```

### Appointments
```
GET    /api/v1/appointments
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id/status
```

### Medical Records
```
GET    /api/v1/hx-records
POST   /api/v1/hx-records
PUT    /api/v1/hx-records/:id
```

### Transactions
```
GET    /api/v1/transactions
POST   /api/v1/transactions
```

### Dashboard
```
GET    /api/v1/dashboard/today
GET    /api/v1/dashboard/summary
```

## 🎨 Paleta de Colores

```css
--color-midnight:   #0a0c18;  /* Fondo principal dark */
--color-navy:       #2b4362;  /* Secundario */
--color-steel:      #aec3d9;  /* Acentos */
--color-frost:      #f2f3f5;  /* Fondo light */
--color-warm-gray:  #cdcbc7;  /* Neutral */

--color-success:    #4caf82;  /* Verde */
--color-warning:    #e8a838;  /* Amarillo */
--color-danger:     #e05c5c;  /* Rojo */
--color-info:       #5b9bd5;  /* Azul */
```

## 📱 Rutas Implementadas

| Ruta | Descripción |
|------|------------|
| `/login` | Login con demo users |
| `/dashboard` | Dashboard con KPIs |
| `/patients` | Gestión de pacientes (preparado) |
| `/appointments` | Agenda (preparado) |
| `/hx-records` | Historia clínica (preparado) |
| `/transactions` | Caja y transacciones (preparado) |
| `/admin/users` | Gestión de usuarios (preparado) |

## 🔐 Seguridad

- ✅ JWT con access token 15 min + refresh token 7 días
- ✅ Rate limiting en login
- ✅ Refresh token rotativo
- ✅ Contraseñas hasheadas con bcrypt (12 salt rounds)
- ✅ CORS configurado por whitelist
- ✅ Headers de seguridad
- ✅ Validación Zod en todas las rutas
- ✅ Middleware de roles

## 🧪 Pruebas Rápidas

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@optix.co","password":"Admin2026!"}'
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 📦 Builds

### Backend
```bash
npm start  # Producción
npm run lint
npm run test
```

### Frontend
```bash
npm run build   # Genera en dist/
npm run preview # Vista previa
```

## 🚨 Pendientes Fase 2

- [ ] Completar módulos CRUD (Patients, Appointments, etc.)
- [ ] Notificaciones WhatsApp, SMS, Email
- [ ] Almacenamiento de archivos (MinIO/S3)
- [ ] Generación de PDFs (reportes, comprobantes)
- [ ] Búsqueda global
- [ ] Exportación de datos (CSV, Excel)
- [ ] Sistema de auditoría
- [ ] Backup automático
- [ ] Tests unitarios e integración
- [ ] CI/CD pipeline

## 📧 Contacto

**SkayLabs** - Sistema Optix  
Gestión profesional para consultorio privado de oftalmología.

---

**Versión:** 1.0.0  
**Estado:** En desarrollo activo  
**Última actualización:** 2026-05-27
