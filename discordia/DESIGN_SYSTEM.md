# DISCORDIA — Design System

> Referencia actualizada desde `index.html` (abril 2026). Úsala como fuente de verdad para cualquier nueva página o componente.

---

## Paleta de Colores

| Token | Hex | Uso real en index.html |
|---|---|---|
| `brand-deep` | `#6d165a` | Títulos, nav hover, texto carrito, badge texto |
| `brand-mid` | `#a0346e` | Precios, labels, links, degradado medio |
| `brand-pink` | `#ec5c8d` | Botones CTA, badges, borders de énfasis, filtros activos |
| `brand-light` | `#ff8c91` | Hover de botones, degradados secundarios |
| `brand-peach` | `#ffc4a6` | Badge contador carrito, subtítulos hero, peach highlight |
| `bg-warm` | `#faf8f7` | Fondo principal (`body`) |
| `bg-section` | `#f5ede8` | Fondo par del body en gradiente |
| `sidebar-border` | `#f1d7e2` | Borde del sidebar del carrito |
| `backdrop` | `#1f0e1b` | Capa de fondo oscura del backdrop del carrito (`/35` opacity) |

### Degradados usados en index.html

```
/* Hero (br) */
from-[#6d165a] via-[#a0346e] to-[#ec5c8d]

/* Botón CTA / carrito flotante / sidebar carrito header */
from-[#ec5c8d] to-[#ff8c91]

/* Hover botón CTA */
from-[#ff8c91] to-[#ffc4a6]

/* Secciones oscuras: testimonios, cajas regalo, pagos Nequi */
from-[#6d165a] to-[#a0346e]

/* Categoría 1 / carrito header / fondo hero preview */
from-[#ffc4a6] to-[#ff8c91]

/* Categoría 2 / pago Contraentrega */
from-[#ec5c8d] to-[#a0346e]

/* Categoría 3 */
from-[#a0346e] to-[#6d165a]

/* Categoría 4 */
from-[#6d165a] to-[#ec5c8d]

/* Pago Daviplata */
from-[#a0346e] to-[#ec5c8d]

/* Pago Breve (texto #6d165a, no blanco) */
from-[#ffc4a6] to-[#ff8c91]  text-[#6d165a]

/* Body / fondo de página */
from-[#faf8f7] to-[#f5ede8]  (bg-gradient-to-br)
```

---

## Tipografías

| Rol | Fuente | Pesos | Uso |
|---|---|---|---|
| **Display / Headings** | Playfair Display (serif) | 400–900, italic | `h2 h3 h4` via `style.css` |
| **Body / UI** | Poppins (sans-serif) | 300, 400, 600, 800 | Todo lo demás (`body` via `style.css`) |

```html
<!-- En el <head> de cualquier página Discordia -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
</style>
<link rel="stylesheet" href="./style.css">
```

---

## Escala tipográfica (valores reales de index.html)

| Elemento | Clases usadas |
|---|---|
| Hero h2 (typed) | `text-[2rem] md:text-[3.3rem] font-extrabold` |
| Título grande (valores, pagos, cajas) | `text-5xl font-bold text-[#6d165a]` |
| Título sección (testimonios, bestsellers) | `text-4xl font-bold` |
| Título sección mediano (categorías) | `text-3xl font-bold text-gray-900` |
| Subtítulo sección | `text-2xl md:text-3xl font-bold text-[#6d165a]` |
| Label de sección | `text-xs uppercase tracking-[0.18em] text-[#a0346e] font-semibold` |
| Label de énfasis hero | `text-xs md:text-sm uppercase tracking-[0.25em] text-[#ffc4a6]` |
| Precio | `text-2xl font-bold text-[#a0346e]` |
| Cuerpo largo | `text-lg md:text-xl text-[#ffc4a6]` (sobre fondo oscuro) |
| Cuerpo normal | `text-gray-700` / `text-gray-600` |
| Texto pequeño | `text-sm text-gray-600` |

---

## Componentes CSS (`style.css`)

### `.button` / `.button.small` / `.button:disabled`
Botón CTA gradiente con sombra y hover lift. Úsalo para botones de catálogo.
```html
<button class="button">Ver Catálogo</button>
<button class="button small">Agregar al carrito</button>
<button class="button" disabled>Agotado</button>
```

### `.brand-chip`
Chip glassmorphism blanco. Usado en las 3 propuestas de valor bajo el hero.
```html
<div class="brand-chip">💎 Originales verificados</div>
```

### `.blur-image` / `.blur-image.loaded`
Imagen con blur-up placeholder (lazy loading desde `catalog.js`).
```html
<img src="[svg-placeholder]" data-lazy-src="./assets/producto.jpg" class="blur-image" loading="lazy">
```

### `.no-scrollbar`
Oculta scrollbar en el carrusel horizontal de hero preview (mobile).

---

## CDNs requeridos (orden de index.html)

```html
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<!-- Google Fonts + style.css aquí -->
<script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"></script>  <!-- antes de </body> -->
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>       <!-- antes de </body> -->
```

---

## Patrones de UI recurrentes

### Tarjeta de producto (catalog.js)
```
bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden
```

### Badge de estado de stock
```
Disponible   → bg-white/90 text-[#a0346e] text-xs font-bold px-2 py-1 rounded-full
Últimas un.  → bg-[#EC407A] text-white   text-xs font-bold px-2 py-1 rounded-full
Agotado      → bg-gray-800 text-white    text-xs font-bold px-2 py-1 rounded-full
```

### Input de búsqueda / formulario
```
px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]
```

### Filtro pill mobile (activo / inactivo)
```
Inactivo → bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700
Activo   → background:#ec5c8d color:#fff border-color:#ec5c8d  (via JS style inline)
```

### Sección con fondo oscuro
```html
<section class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] py-20 text-white">
```

### Botón flotante (carrito / WhatsApp)
```
Cart:      fixed z-50 rounded-full shadow-xl bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91]
           bottom-4 right-3  sm:bottom-6 sm:right-4
WhatsApp:  fixed z-30 rounded-full
           bottom-28 right-3  sm:bottom-32 sm:right-4  (encima del cart, z menor al backdrop)
```

---

## Regla rápida para nuevos componentes

```
Fondo oscuro  → texto blanco + #ffc4a6 para subtítulos
Fondo claro   → #6d165a para títulos · #a0346e para precios / links
Botón activo  → .button  o  from-[#ec5c8d] to-[#ff8c91]
Botón hover   → from-[#ff8c91] to-[#ffc4a6]
Border accent → border-[#ec5c8d]  o  border-[#f1d7e2]
Sombra CTA    → 0 10px 24px rgba(236,92,141,0.24)
```

---

## Assets de marca (`discordia/assets/`)

| Archivo | Uso real |
|---|---|
| `logo-discordia.png` | Favicon, manifest icons, sección "Nuestro Propósito" |
| `texto-discordia.png` | Header — `<img class="h-9 md:h-11">` |
| `logo-ico.png` | Ícono solo (sin texto) |
| `logo-ico-transp.png` | Ícono transparente |
| `logo-full-transp.png` | Logo completo fondo transparente |
| `logo-text-transp.png` | Texto transparente |
| `default.png` | Fallback de imágenes de producto (`onerror`) |
| `no-stock.png` | Sección "Cajas Regalo" |


### Degradados canónicos

```css
/* Hero / secciones principales */
background: linear-gradient(135deg, #6d165a, #a0346e, #ec5c8d);

/* Botón CTA */
background: linear-gradient(90deg, #ec5c8d, #ff8c91);
/* hover */
background: linear-gradient(90deg, #ff8c91, #ffc4a6);

/* Secciones oscuras (testimonios, cajas regalo) */
background: linear-gradient(90deg, #6d165a, #a0346e);
```

En Tailwind:
```
from-[#6d165a] via-[#a0346e] to-[#ec5c8d]   ← hero
from-[#ec5c8d] to-[#ff8c91]                  ← botón
from-[#ff8c91] to-[#ffc4a6]                  ← botón hover
from-[#6d165a] to-[#a0346e]                  ← secciones oscuras
```

---

## Tipografías

| Rol | Fuente | Pesos | Uso |
|---|---|---|---|
| **Display / Headings** | Playfair Display (serif) | 400–900, italic | `h2 h3 h4`, nav, títulos de sección |
| **Body / UI** | Poppins (sans-serif) | 300, 400, 600, 800 | Párrafos, botones, badges, inputs |

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
</style>
```

CSS base:
```css
body        { font-family: 'Poppins', sans-serif; }
h2, h3, h4  { font-family: 'Playfair Display', serif; }
```

---

## Escala tipográfica (Tailwind)

| Elemento | Clases |
|---|---|
| Hero h2 | `text-[2rem] md:text-[3.3rem] font-extrabold` |
| Título sección | `text-3xl md:text-4xl font-bold` |
| Subtítulo | `text-lg md:text-xl font-semibold` |
| Body | `text-sm md:text-base` |
| Label pequeño | `text-xs uppercase tracking-[0.2em] font-semibold` |
| Precio | `text-2xl font-extrabold text-[#a0346e]` |

---

## Componentes CSS (`style.css`)

### `.button`
Botón CTA gradiente rosa con sombra y hover lift.
```html
<button class="button">Ver Catálogo</button>
<button class="button small">Agregar</button>
<button class="button" disabled>Agotado</button>
```

### `.brand-chip`
Chip glassmorphism blanco para propuestas de valor.
```html
<div class="brand-chip">💎 Originales verificados</div>
```

### `.blur-image` / `.blur-image.loaded`
Imagen con blur-up placeholder (lazy loading).
```html
<img src="[placeholder-svg]" data-lazy-src="./assets/producto.jpg" class="blur-image" loading="lazy">
```

### `.no-scrollbar`
Oculta scrollbar en el carrusel horizontal de productos.

---

## CDNs requeridos

```html
<!-- Tailwind -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- SweetAlert2 -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">

<!-- Font Awesome 6.5 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

<!-- AOS Animations -->
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

<!-- Typed.js -->
<script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"></script>
```

---

## Patrones de UI recurrentes

### Tarjeta de producto
```
bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden
```

### Badge de estado
```
Disponible  → bg-white/90 text-[#a0346e] text-xs font-bold px-2 py-1 rounded-full
Últimas un. → bg-[#EC407A] text-white text-xs font-bold px-2 py-1 rounded-full
Agotado     → bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full
```

### Input
```
px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ec5c8d]
```

### Sección con fondo oscuro
```html
<section class="bg-gradient-to-r from-[#6d165a] to-[#a0346e] py-20 text-white">
```

---

## Regla rápida para nuevos componentes

```
Fondo oscuro  → texto blanco + #ffc4a6 para subtítulos
Fondo claro   → #6d165a para títulos · #a0346e para precios
Botón activo  → .button  o  from-[#ec5c8d] to-[#ff8c91]
Botón hover   → from-[#ff8c91] to-[#ffc4a6]
Border accent → border-[#ec5c8d]  o  border-[#f1d7e2]
Sombra CTA    → shadow: 0 10px 24px rgba(236,92,141,0.24)
```

---

## Assets de marca (`discordia/assets/`)

| Archivo | Uso |
|---|---|
| `logo-discordia.png` | Logo completo (ícono + texto), favicon, manifest |
| `texto-discordia.png` | Solo el texto "DISCORDIA" para el header |
| `logo-ico.png` | Ícono solo (sin texto) |
| `logo-ico-transp.png` | Ícono transparente |
| `logo-full-transp.png` | Logo completo fondo transparente |
| `logo-text-transp.png` | Texto transparente |
| `default.png` | Fallback de imagen de producto |
| `no-stock.png` | Imagen para sección sin stock / cajas regalo |
