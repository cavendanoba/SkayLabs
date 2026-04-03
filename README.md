# 🚀 SkayLabs

**Creative Coding & Futuristic Design** — Portafolio de proyectos frontend modernos y aplicaciones web de alta performance.

Colección de micrositios y SPAs independientes construidos con HTML estático, JavaScript ES Modules vanilla y Tailwind CSS. Cada proyecto está optimizado para producción con énfasis en experiencia de usuario, accesibilidad y rendimiento.

---

## 📦 Proyectos

### 🛍️ **Discordia** — Catálogo de Belleza & Maquillaje
Tienda frontend responsiva con carrito persistente, panel de administración y sincronización remota.

- **Localización:** `/discordia`
- **Características:**
  - Catálogo dinámico con filtros, búsqueda y ordenamiento
  - Carrito con persistencia en `localStorage`
  - Modal de producto con SweetAlert2
  - Lazy-loading + blur-up para imágenes
  - Panel admin: editar catálogo, ver ventas y clientes
  - Sincronización bidireccional (local/remota vía KV)
  - Integración WhatsApp para checkout
- **Stack:** HTML5, Tailwind CDN, ES Modules, SweetAlert2, AOS
- **Iniciar localmente:**
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000/discordia/
  ```

---

### 💰 **CopCash** — Organizador de Nómina Personal Avanzado
SPA financiera con arquitectura MVC para gestionar salario, gastos, tarjetas de crédito, metas de ahorro y proyección de flujo de caja.

- **Localización:** `/copcash`
- **Características:**
  - Dashboard con KPIs en tiempo real
  - Gestión de gastos fijos y variables
  - Administración de tarjetas de crédito con sistema de cuotas
  - Metas de ahorro con cálculo automático
  - Proyección de flujo de caja (30-60 días)
  - Categorías personalizables con presupuestos
  - Modo oscuro/claro
  - Exportar/importar datos (JSON)
  - Todos los datos locales (sin sincronización remota)
- **Stack:** HTML5, Tailwind CDN, Chart.js, JavaScript ES6+
- **Iniciar localmente:**
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000/copcash/
  ```

---

### 🌿 **BiECO** — Limpieza Ecológica Sostenible
Landing page comercial para productos de limpieza en tabletas. Enfoque en sostenibilidad y marketing directo.

- **Localización:** `/bieco`
- **Características:**
  - Hero animado con propuesta de valor
  - Showcase de productos
  - Integración WhatsApp para consultas y ventas
  - Diseño responsivo y moderno
- **Stack:** HTML5, Tailwind CDN, AOS Animations
- **Iniciar localmente:**
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000/bieco/
  ```

---

### 🏠 **Portafolio Principal**
Página raíz que lista proyectos, skills y contacto. Punto de entrada al ecosistema.

- **Localización:** `/index.html`
- **Características:**
  - Hero con animación Typed.js
  - Sección de proyectos con carousel
  - Galería de skills
  - Particles.js background
  - Navegación smooth
- **Stack:** HTML5, Tailwind CDN, Particles.js, AOS

---

## 🗂️ Estructura del Repositorio

```
SkayLabs/
├── index.html                    # Portal principal
├── 404.html                      # Página de error estática
├── favicon.ico                   # Favicon
│
├── discordia/                    # Tienda de belleza
│   ├── index.html
│   ├── app.js                    # Bootstrap & wiring
│   ├── config.js                 # Config centralizada
│   ├── catalog.js                # Motor de catálogo
│   ├── cart.js                   # Lógica del carrito
│   ├── admin.js                  # Panel de administración
│   ├── products.js               # Catálogo por defecto
│   ├── style.css
│   ├── components/               # Componentes reutilizables
│   ├── data/                     # Datos seed
│   └── assets/                   # Imágenes
│
├── copcash/                      # Gestor financiero SPA
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── models/
│   │   │   ├── storage.js        # CRUD & persistencia
│   │   │   └── calculos.js       # Lógica financiera
│   │   ├── controllers/
│   │   │   └── router.js         # Router SPA
│   │   └── views/                # Vistas por módulo
│   ├── data/
│   │   └── seedData.js           # Datos de ejemplo
│   └── README.md
│
├── bieco/                        # Landing ecológico
│   ├── index.html
│   └── README.md
│
├── api/
│   └── skc-data.js               # Serverless API (KV + fallback memory)
│
├── assets/                       # Recursos compartidos
│   ├── logos/
│   ├── images/
│   └── default.png               # Fallback universal
│
├── payroll-manager/              # En desarrollo
├── proyectos/                    # Área de pruebas
└── trash/                        # Archivos descartados
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
