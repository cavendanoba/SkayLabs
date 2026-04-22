# DISCORDIA — Design System

> Referencia actualizada para la paleta de abril 2026. Usa este diseño para cualquier nueva página o componente Discordia.

---

## Paleta de Colores

| Token | Hex | Uso real en Discordia |
|---|---|---|
| `--pale-sky` | `#d0edfdff` | Superficies suaves, hero gradient, overlays claros |
| `--seashell` | `#fcf5eeff` | Fondos de cards, bordes ligeros, hover suave |
| `--lavender-veil` | `#ecd9ffff` | CTA principal, badges, acentos en gradientes |
| `--petal-frost` | `#ffd5e3ff` | CTA hover, highlights, buttons secundarios |
| `--brand-accent` | `#5c4a6d` | Texto oscuro, títulos, badges de énfasis |
| `--brand-border` | `rgba(92, 74, 109, 0.18)` | Bordes suaves de chips y cards |
| `--warm` | `#faf8f7` | Fondo general, surfaces cálidos |
| `--section` | `#f5ede8` | Fondos de sección y gradientes ligeros |

### Degradados usados en Discordia

```
/* Hero */
from-[#d0edfd] via-[#ecd9ff] to-[#ffd5e3]

/* Botón CTA / carrito flotante / sidebar carrito header */
from-[#ecd9ff] to-[#ffd5e3]

/* Hover botón CTA */
from-[#ffd5e3] to-[#fcf5ee]

/* Fondo claro general */
from-[#faf8f7] to-[#f5ede8]
```

---

## Tokens principales

- `--pale-sky`: color de fondo ligero, hero, cards y overlays.
- `--seashell`: tono cálido para superficies claras y estados inactivos.
- `--lavender-veil`: el color principal de llamadas a la acción.
- `--petal-frost`: el tono de acento secundario y hover.
- `--brand-accent`: contraste oscuro para texto, headings y botones inversos.
- `--brand-border`: bordes suaves y contornos de vidrio.

---

## Tipografías

| Rol | Fuente | Pesos | Uso |
|---|---|---|---|
| **Display / Headings** | Playfair Display (serif) | 400–900, italic | `h2`, `h3`, `h4`, títulos principales |
| **Body / UI** | Poppins (sans-serif) | 300, 400, 600, 800 | Texto del sitio, botones, labels, inputs |

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
</style>
<link rel="stylesheet" href="./style.css">
```

---

## Escala tipográfica actual

| Elemento | Clases usadas |
|---|---|
| Hero principal | `text-[2rem] md:text-[3.3rem] font-extrabold` |
| Título grande | `text-5xl font-bold` |
| Título sección | `text-4xl font-bold` |
| Subtítulo sección | `text-3xl md:text-4xl font-bold` |
| Precio | `text-2xl font-bold text-[#5c4a6d]` |
| Cuerpo principal | `text-base md:text-lg text-gray-700` |
| Texto pequeño | `text-sm text-gray-600` |

---

## Componentes CSS (`style.css`)

### `.button`

Botón CTA con gradiente suave y elevación al hover.

```html
<button class="button">Ver Catálogo</button>
<button class="button small">Agregar al carrito</button>
<button class="button" disabled>Agotado</button>
```

### `.brand-chip`

Chip blanco con borde suave y texto oscuro.

```html
<div class="brand-chip">💎 Originales verificados</div>
```

### `.blur-image` / `.blur-image.loaded`

Imagen con efecto blur-up para lazy loading.

```html
<img src="[placeholder-svg]" data-lazy-src="./assets/producto.jpg" class="blur-image" loading="lazy">
```

### `.no-scrollbar`

Oculta la barra de desplazamiento en carruseles horizontales.

---

## CDNs requeridos

```html
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"></script>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
```

---

## Patrones de UI frecuentes

### Tarjeta de producto

```
bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden
```

### Badge de estado de stock

```
Disponible  → bg-white/90 text-[#5c4a6d] text-xs font-bold px-2 py-1 rounded-full
Últimas un. → bg-[#ecd9ff] text-[#5c4a6d] text-xs font-bold px-2 py-1 rounded-full
Agotado     → bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full
```

### Input de formulario

```
px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ecd9ff]
```

### Filtro pill mobile

```
Inactivo → bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700
Activo   → bg-[#ecd9ff] text-[#5c4a6d] border-[#ecd9ff]
```

### Sección con fondo claro

```
<section class="bg-gradient-to-br from-[#faf8f7] to-[#f5ede8] py-20">
```

### Botón flotante / CTA

```
from-[#ecd9ff] to-[#ffd5e3]
hover: from-[#ffd5e3] to-[#fcf5ee]
```

---

## Regla rápida para nuevos componentes

- Fondo claro → texto oscuro `#5c4a6d`.
- CTA principal → `from-[#ecd9ff] to-[#ffd5e3]`.
- Hover CTA → `from-[#ffd5e3] to-[#fcf5ee]`.
- Bordes suaves → `border-[#brand-border]` o `border-gray-200`.
- Sombra CTA → `0 10px 24px rgba(237, 217, 255, 0.4)`.

---

## Assets de marca (`discordia/assets/`)

| Archivo | Uso |
|---|---|
| `logo-discordia.png` | Favicon, manifest, logo principal |
| `texto-discordia.png` | Header logo con texto |
| `logo-ico.png` | Icono solo |
| `logo-ico-transp.png` | Icono con fondo transparente |
| `logo-full-transp.png` | Logo completo transparente |
| `logo-text-transp.png` | Texto del logo en PNG transparente |
| `default.png` | Fallback de imagen de producto |
| `no-stock.png` | Imagen de sección sin stock / cajas regalo |
