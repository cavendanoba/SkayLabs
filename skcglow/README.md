# SkayLabs — SKC Glow

Proyecto frontend estático para catálogo y carrito de compras de SkayLabs (SKC Glow).

## Resumen

- **Nombre del proyecto:** SkayLabs (SKC Glow)
- **Tecnologías:** HTML estático + ES Modules (vanilla JS), Tailwind CDN, AOS, SweetAlert2
- **Objetivo:** catálogo de productos, carrito simple, panel de administración ligero (edición de catálogo en localStorage), optimizaciones de imágenes (lazy-loading + blur-up)

## Estructura del repositorio

- `index.html` — entrada principal del sitio; contiene estilos esenciales y referencias a los scripts.
- `app.js` — inicialización / bootstrap (si existe en el proyecto).
- `products.js` — array con productos por defecto.
- `catalog.js` — renderizado del catálogo, lazy-loading, blur-up placeholder, modal de producto.
- `cart.js` — lógica del carrito (añadir/quitar/actualizar), persistencia en `localStorage`.
- `assets/` — imágenes y recursos (incluye `default.png`, `logo-ico-transp.png`, etc.).
- `style.css` — estilos adicionales (puede estar vacío o contener estilos personalizados).
- `PERFORMANCE.md` — notas sobre optimizaciones aplicadas.

## Requisitos

- Navegador moderno (IntersectionObserver para lazy-loading).
- Servidor estático para pruebas (opcional):

```bash
# Desde la raíz del proyecto
python3 -m http.server 8000
# Abrir http://localhost:8000
```

## Cómo ejecutar localmente

1. Abrir `index.html` en el navegador (suficiente para pruebas rápidas) o usar un servidor local como el comando anterior.
2. El catálogo se renderiza automáticamente en el contenedor con id `catalog` mediante `renderCatalog('catalog')` (esto lo hace la inicialización en `index.html` o `app.js`).

## Desarrollo y edición

- **Productos:** editar `products.js` para cambiar nombre, precio, stock y `image`.
- **Catálogo:** `renderCatalog(containerId)` en `catalog.js` genera las tarjetas; conserva `data-lazy-src` para lazy-loading.
- **Carrito:** funciones principales en `cart.js`. Estado persistente en `localStorage` bajo la clave `skcCart`.

## Características clave

- **Lazy-loading + Blur-up:** `catalog.js` implementa `createBlurPlaceholder()` y `setupLazyLoadingWithBlur()` usando `IntersectionObserver`.
- **Fallback de imagen:** `assets/default.png` se usa cuando falta la imagen del producto; hay handlers seguros y un `window.handleImageError` como red.
- **Carrito con persistencia:** acciones en el carrito actualizan `localStorage` y la UI; `updateCartCount()` mantiene el badge del header.
- **Botones estilizados:** clase `.button` inspirada en Uiverse/Gumroad (inyectada en `index.html`) configurable por variables CSS.
- **SVGs inline:** íconos del footer y botón de WhatsApp están embebidos como SVG para control visual y tamaño.

## Personalización rápida

- Cambiar favicon: editar `<link rel="icon">` en `index.html` y reemplazar `assets/logo-ico-transp.png`.
- Ajustar colores del botón: modificar `--bg` y `--hover-bg` en la regla `.button` dentro de `index.html`.
- Cambiar tamaño de imagen del catálogo: editar `height` inline `calc(8rem * 1.05)` o la clase `h-32` en `catalog.js`.

## Despliegue

### Opción recomendada: Vercel con subdominio/ruta

Para desplegar en `skaylabs.site/skcglow` usando Vercel:

1. **Crear `vercel.json`** en la raíz del proyecto:

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

2. **Pasos en Vercel:**
   - Conecta tu repositorio (GitHub/GitLab/Bitbucket) a Vercel.
   - En **Project Settings → Domains**, añade `skaylabs.site` como dominio personalizado.
   - Configura una ruta: si quieres servir desde `/skcglow`, usa un proyecto separado en Vercel o configura rewrites en tu sitio principal.

3. **Alternativa: Monorepo (recomendado para `/skcglow`):**
   - En tu sitio principal (`skaylabs.site`), crea la carpeta `apps/skcglow/`.
   - Mueve el contenido de este proyecto a esa carpeta.
   - En `vercel.json` del sitio principal, configura:

```json
{
  "rewrites": [
    {
      "source": "/skcglow/:path*",
      "destination": "/apps/skcglow/:path*"
    }
  ]
}
```

4. **Para servir localmente con la ruta `/skcglow`:**

```bash
# Usa un servidor que soporte rewrites
npx vercel dev
# O configura un simple-http-server con proxy
python3 -m http.server 8000
# Accede a http://localhost:8000/skcglow/ (requiere configuración del servidor)
```

### Otras opciones

- **Netlify:** similar a Vercel; conecta el repositorio y usa el dominio personalizado.
- **GitHub Pages:** soporta solo dominios en raíz o subdominios (github.io), requiere workflow personalizado.

### Checklist pre-despliegue

- [ ] Actualizar `index.html` si usas rutas relativas (verificar que no haya rutas absolutas `/`).
- [ ] Comprimir imágenes con herramientas como `ImageOptim` o `TinyPNG`.
- [ ] Probar en modo producción localmente.
- [ ] Validar links y assets en la URL de producción.

## Rendimiento y buenas prácticas

- Comprimir imágenes y preferir WebP/AVIF para producción.
- Mantener miniaturas ligeras; cargar imágenes grandes solo en modal.
- Revisar `PERFORMANCE.md` para recomendaciones adicionales.

## Problemas comunes & soluciones

- `ReferenceError: handleImageError is not defined` — ocurría al usar `onerror` inline apuntando a una función de módulo. Soluciones: exponer `handleImageError` en `window` o usar `onerror="this.src='assets/default.png'; this.onerror=null;"`.
- Estilos no aplicados: si `style.css` está vacío, algunas reglas se inyectan en `index.html` dentro de `<style>` para aplicar inmediatamente.
- CORS/hosting: asegúrate de alojar recursos estáticos con los headers adecuados si sirves desde un dominio distinto.

## Contribuir

- Abre issues o pull requests con cambios pequeños y descriptivos.
- Mantén el código simple: ES modules, sin frameworks pesados.

## Contacto

- Marca / página principal: **SkayLabs** — SKC Glow
- Para cambios mayores o preguntas, abre un issue en el repositorio.

---