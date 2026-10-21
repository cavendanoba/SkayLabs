# SkayLabs — Portfolio (Astro)

Refactorización del portfolio de `skaylabs.site`, migrado de un `index.html` monolítico
(1900+ líneas, CSS inline, Tailwind por CDN, particles.js, AOS) a un proyecto Astro
modular, liviano y con SEO real.

## Qué cambió respecto a la versión anterior

- **Componentes separados**: Header, Hero, About, Skills, Projects, Contact, Footer —
  cada uno en su propio archivo en `src/components/`.
- **Contenido separado del markup**: proyectos y habilidades viven en `src/data/`, así
  que agregar un proyecto nuevo es editar un array, no tocar HTML.
- **Contenido real**: se reemplazó el carrusel vacío por un grid con los 4 proyectos
  reales del repo (Discordia, CopCash, BiECO, infraestructura SkayLabs). Ajusta
  `src/data/projects.js` con las URLs y descripciones definitivas.
- **SEO**: meta description específica, Open Graph, Twitter Card y JSON-LD tipo
  `Person` en `src/layouts/Layout.astro`. Falta que agregues una imagen real en
  `public/og-image.png` (1200x630).
- **Íconos de tecnologías reales, pero livianos**: en vez del enfoque anterior (una librería de íconos completa por CDN), cada tecnología carga un solo SVG pequeño desde `simpleicons.org` bajo demanda (`loading="lazy"`). Se ve igual de bien, sin la sobrecarga.
- **Fondo animado, sin `particles.js`**: el punto brillante que se movía en el sitio viejo dependía de una librería de canvas corriendo en loop constante — pesada para batería y rendimiento móvil. Se reemplazó por `Starfield.astro`: puntos generados en build time (servidor), animados solo con CSS (`@keyframes`), cero JavaScript en el cliente, y respeta `prefers-reduced-motion`.
- **Identidad visual real**: se integraron los 4 archivos de marca definitivos
  (`skaylabs-icon-mark.svg`, `skaylabs-icon-mono.svg`,
  `skaylabs-logo-horizontal-dark.svg`, `skaylabs-logo-horizontal-light.svg`) en
  `public/`. El ícono mark se usa como favicon y og-image. Paleta actualizada en
  `tailwind.config.mjs`: fondo espacio profundo (`#0B0B1A`), acento púrpura/fucsia
  (`#B23FD1`) y rosa amanecer (`#FFC9EA`). Tipografías: Poppins (cuerpo) y Prosto One
  (el "Cristhian" del hero, a juego con el monograma SL del logo).

- **Casos de estudio** (`CaseStudies.astro` + `src/data/caseStudies.js`): cada proyecto
  como problema → decisión → resultado, en vez de solo nombre y tags. Incluye la
  migración real de Discordia (Vercel+Neon → Cloudflare+Postgres autoalojado).
- **Infraestructura en vivo, de verdad** (`InfraStatus.astro` + `functions/api/status.js`):
  ya no es un array quemado. Al desplegar en Cloudflare Pages, la función
  `functions/api/status.js` corre como Pages Function y hace un `fetch` real a
  `nube.skaylabs.site/status.php` (Nextcloud) y `casaos.skaylabs.site` (CasaOS) cada
  vez que alguien carga la página, con caché desactivada. El componente hace polling
  cada 60s en el navegador. PostgreSQL y el túnel de Cloudflare se muestran como "no
  verificable por HTTP" — no hay endpoint público seguro para chequearlos sin exponer
  más superficie; si más adelante quieres verificarlos también, lo normal sería un
  endpoint propio autenticado en tu servidor que la función consulte.
  **Nota**: esto NO funciona con `npm run preview` local para la parte de fetch a tus
  subdominios reales si tu servidor los bloquea por origen — pruébalo ya desplegado en
  Cloudflare Pages.

## Pendientes que debes completar tú

- [x] Correo de contacto definido: `skaylabs@proton.me`, sin formulario — se explica qué servicios se ofrecen (web, SaaS, infraestructura) y el tiempo de respuesta.
- [ ] Completar URLs de `url` y `repo` vacíos en `src/data/projects.js`.
- [ ] Agregar `public/favicon.ico` y `public/og-image.png`.
- [ ] Revisar el texto de `About.astro` y ajustarlo a tu gusto.
- [ ] Si quieres blog o CV descargable, lo agregamos como páginas nuevas en `src/pages/`.

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

## Cómo desplegarlo

Cloudflare Pages (recomendado, ya usas Cloudflare para el resto de SkayLabs):

```bash
npm run build
# output en ./dist — conéctalo como build de Cloudflare Pages
# Build command: npm run build
# Output directory: dist
```
