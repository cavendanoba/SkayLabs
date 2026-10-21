# OPTIX - Comandos Rápidos de Referencia

## 🚀 INICIAR PROYECTO

```bash
# Terminal 1 - Docker
cd d:\Documentos\Optix
docker-compose up -d

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 🔧 CONFIGURACIÓN INICIAL (primera vez)

```bash
# Backend
cd backend
npm install
npm run migrate
npm run seed

# Frontend
cd frontend
npm install
```

## 📊 VERIFICACIÓN

```bash
# Probar API
node test-api.js

# Health check
curl http://localhost:3001/health

# Ver logs de Docker
docker-compose logs postgres
docker-compose logs redis
```

## 💾 BASE DE DATOS

```bash
# Aplicar migraciones
npm run migrate

# Ver Prisma Studio (UI de BD)
npm run studio

# Limpiar y cargar demo nuevamente
npm run seed
```

## 🧹 LIMPIAR

```bash
# Detener Docker
docker-compose down

# Borrar volúmenes (advertencia: pierde datos)
docker-compose down -v

# Limpiar node_modules
rm -r backend/node_modules
rm -r frontend/node_modules
npm install (en cada carpeta)
```

## 📝 DESARROLLO

```bash
# Backend - dev (con nodemon)
npm run dev

# Backend - producción
npm start

# Frontend - dev (Vite)
npm run dev

# Frontend - build
npm run build

# Frontend - preview del build
npm run preview
```

## 🧪 TESTING

```bash
# Script de pruebas API
node test-api.js

# Tests unitarios (cuando existan)
npm run test

# Linting
npm run lint
```

## 📚 CREDENCIALES DEMO

```
Admin:
  Email: admin@optix.co
  Password: Admin2026!

Doctor:
  Email: medico@optix.co
  Password: Doctor2026!

Receptionist:
  Email: recepcion@optix.co
  Password: Recep2026!
```

## 🔐 LOGS Y DEBUGGING

```bash
# Ver logs del backend en tiempo real
npm run dev

# Ver logs de Docker
docker-compose logs -f postgres

# Ver procesos Node
tasklist | findstr node
```

## 🌐 URLs

```
Backend:     http://localhost:3001
Frontend:    http://localhost:5173
Health:      http://localhost:3001/health
Prisma UI:   http://localhost:5555 (cuando se ejecuta studio)
API:         http://localhost:3001/api/v1
```

## 📋 RUTAS API DISPONIBLES

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

## 🛠️ MANTENIMIENTO

```bash
# Actualizar dependencias
npm update

# Buscar vulnerabilidades
npm audit

# Instalar dependencia nueva
npm install nombrePaquete

# Desinstalar dependencia
npm uninstall nombrePaquete
```

## 📦 CREAR DISTRIBUCIÓN

```bash
# Frontend build
cd frontend
npm run build
# Genera en: dist/

# Backend - solo copiar src/ y prisma/
```

## 🐛 TROUBLESHOOTING

```bash
# Puerto ya en uso (5173)
netstat -ano | findstr 5173
taskkill /PID <pid> /F

# PostgreSQL no conecta
docker-compose ps
docker-compose logs postgres

# npm install lento/falla
npm cache clean --force
rm package-lock.json
npm install

# Migraciones falladas
npm run migrate:prod
npm run seed

# Backend no reinicia (nodemon)
Ctrl+C
npm run dev
```

## 📱 RESPONSIVE TESTING

```bash
# Chrome DevTools
F12 → Ctrl+Shift+M

# Tamaños comunes
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x812
```

## 💬 CONSULTAS RÁPIDAS

```bash
# ¿Qué funciona?
node test-api.js

# ¿Backend está up?
curl http://localhost:3001/health

# ¿PostgreSQL está running?
docker-compose ps

# ¿Qué puertos están ocupados?
netstat -ano | grep LISTENING
```

## 📖 DOCUMENTACIÓN

```bash
# Abrir README
README.md

# Ver contexto de desarrollo
CONTEXTO_DESARROLLO.md

# Guía rápida interactiva
node QUICKSTART.js

# Este archivo
COMANDOS.md
```

## ⚠️ ADVERTENCIAS

⚠️ NO ejecutar `npm audit fix --force` sin revisar cambios
⚠️ NO commit de .env con secretos reales
⚠️ NO eliminar prisma/migrations sin backup
⚠️ NO usar admin@optix.co en producción
⚠️ NO exponer JWT_SECRET en código
⚠️ NO usar contraseña "Admin2026!" en producción

## 🎯 QUICK FIXES

```bash
# "Module not found"
npm install

# "Cannot find module '@prisma/client'"
npm install && npm run migrate

# "Port already in use"
# Cambiar en .env PORT=3002 (backend)
# o Cambiar en vite.config.js port: 5174 (frontend)

# "Database connection failed"
docker-compose ps
docker-compose up -d postgres
npm run migrate

# "Tokens invalid/expired"
Limpiar localStorage (Dev Tools → Application)
Refrescar página e iniciar sesión nuevamente
```

## 🎨 ACTUALIZAR ESTILOS

```bash
# Archivos CSS en:
frontend/src/assets/styles/

# Variables en:
frontend/src/assets/styles/_variables.css

# Cambios en vivo (Vite reload automático)
```

## 📊 STATS RÁPIDOS

```bash
# Contar líneas de código
wc -l src/**/*.js (en cada carpeta)

# Ver tamaño de node_modules
du -sh node_modules

# Listar todas las rutas
grep -r "router\." backend/src/modules/ | grep "post\|get\|put"
```

## 🚀 DEPLOYMENT (cuando llegue el momento)

```bash
# Build frontend
cd frontend
npm run build

# Copiar dist/ a servidor
# Backend: copiar src/ y prisma/
# PostgreSQL: configurar BD remota

# Variables de entorno en producción:
NODE_ENV=production
FRONTEND_URL=https://app.optix.co
JWT_SECRET=(muy secreto)
DATABASE_URL=postgresql://...
etc.
```

---

**Última actualización:** 2026-05-27
**Proyecto:** Optix SaaS
**Equipo:** SkayLabs
