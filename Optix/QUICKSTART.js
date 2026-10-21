#!/usr/bin/env node

/*
 * OPTIX - Quick Start Guide
 * Gestión Clínica Oftalmológica by SkayLabs
 * 
 * Este script proporciona instrucciones para iniciar Optix
 */

console.clear();

const instructions = `
╔════════════════════════════════════════════════════════════════════════╗
║                        🏥 OPTIX QUICK START                            ║
║                  Gestión Clínica Oftalmológica SaaS                    ║
╚════════════════════════════════════════════════════════════════════════╝

✅ ESTADO ACTUAL:
   • Backend: Implementado (Express + Prisma + PostgreSQL)
   • Frontend: Implementado (Vite + Vanilla JS + Bootstrap)
   • Base de datos: Inicializada con datos demo
   • Autenticación: JWT + Refresh Token funcionando
   • Interfaz: Tema dark/light, UI en español

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 PARA INICIAR (Requiere 3 terminales)

1️⃣  TERMINAL 1 - Docker (Base de Datos)
    \$ docker-compose up -d
    → Espera 5-10 segundos para que PostgreSQL esté listo
    → Verifica con: docker-compose ps

2️⃣  TERMINAL 2 - Backend (Puerto 3001)
    \$ cd backend
    \$ npm run dev
    → Verás: "✓ Servidor Optix corriendo en puerto 3001"
    → Health check: curl http://localhost:3001/health

3️⃣  TERMINAL 3 - Frontend (Puerto 5173)
    \$ cd frontend
    \$ npm run dev
    → Se abrirá automáticamente: http://localhost:5173
    → Login y navega el dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 CREDENCIALES DEMO

   Administrador:
   └─ admin@optix.co / Admin2026!

   Médico:
   └─ medico@optix.co / Doctor2026!

   Recepcionista:
   └─ recepcion@optix.co / Recep2026!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VERIFICAR FUNCIONAMIENTO

   \$ node test-api.js
   → Prueba login, auth, y endpoints

   \$ curl http://localhost:3001/health
   → Debe responder: {"status":"OK",...}

   Frontend: http://localhost:5173
   → Login con admin@optix.co / Admin2026!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 ESTRUCTURA

   optix/
   ├── backend/
   │   ├── src/ (config, modules, middlewares, utils)
   │   ├── prisma/ (schema, migrations, seed)
   │   ├── server.js
   │   ├── package.json
   │   └── .env
   │
   ├── frontend/
   │   ├── src/ (assets, components, pages, services, utils)
   │   ├── index.html
   │   ├── vite.config.js
   │   └── package.json
   │
   ├── docker-compose.yml
   ├── README.md
   └── CONTEXTO_DESARROLLO.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ STACK

   Backend:
   • Node.js 20 + Express 4.18.2
   • Prisma 5 + PostgreSQL 16
   • JWT + Bcrypt
   • Zod (validación)

   Frontend:
   • Vanilla JavaScript ES2022+
   • Vite 5
   • Bootstrap 5
   • CSS modular propio

   Infraestructura:
   • Docker + Docker Compose
   • PostgreSQL 16
   • Redis 7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTACIÓN

   README.md
   └─ Guía completa del proyecto, stack técnico, endpoints

   CONTEXTO_DESARROLLO.md
   └─ Estado actual, lo implementado, lo pendiente

   test-api.js
   └─ Script para verificar endpoints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRÓXIMAS FASES

   Fase 2: Módulos CRUD (Users, Patients, Appointments, etc.)
   Fase 3: UI Completa (Navbar, Tablas, Páginas)
   Fase 4: Features Avanzadas (Notificaciones, PDFs, etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  NOTAS IMPORTANTES

   • Los datos demo se crean en cada seed (puedes modificar prisma/seed.js)
   • Los tokens JWT expiran en 15 min (access) + 7 días (refresh)
   • Tema dark es por defecto, toggle en el navbar
   • Todo está en español
   • CORS está configurado solo para localhost:5173

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 TROUBLESHOOTING

   Backend no arranca:
   └─ Verifica que PostgreSQL esté en Docker: docker-compose ps
   └─ Revisa .env tiene DATABASE_URL correcta
   └─ Intenta: npm run migrate && npm run seed

   Frontend no carga:
   └─ Verifica npm install: ls node_modules | wc -l
   └─ Puerto 5173 ocupado: netstat -ano | findstr 5173

   Login no funciona:
   └─ Verifica que backend esté en puerto 3001
   └─ Prueba: curl http://localhost:3001/health
   └─ Revisa credenciales demo en CONTEXTO_DESARROLLO.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 CONTACTO

   Proyecto: Optix SaaS
   Descripción: Gestión Clínica Integral para Oftalmología
   Stack: Node.js + PostgreSQL + Vanilla JS
   Estado: MVP - Fase 1 Completa
   Equipo: SkayLabs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Listo para empezar. ¡Abre 3 terminales y ejecuta los comandos arriba!
`;

console.log(instructions);
