# Optimizaciones de Rendimiento - SKC Glow

## Implementadas

### 1. **Lazy Loading con IntersectionObserver**
- Las imágenes del catálogo se cargan solo cuando están a punto de ser visibles
- Mejora significativa en tiempo inicial de carga
- Compatible con navegadores modernos, con fallback para navegadores antiguos

**Ubicación:** `catalog.js` - función `setupLazyLoadingWithBlur()`

**Cómo funciona:**
- Las imágenes se cargan inicialmente con un placeholder SVG borroso
- Cuando el usuario hace scroll y la imagen está próxima a ser visible, se carga la imagen real
- `rootMargin: '50px'` carga imágenes 50px antes de ser visibles (experiencia fluida)

### 2. **Blur-up Effect (Placeholder Borroso)**
- Muestra un placeholder SVG con efecto blur mientras carga la imagen real
- Mejora la percepción de velocidad de carga
- Transición suave con desvanecimiento (500ms)

**Ubicación:** `index.html` - estilos CSS `.blur-image` y `.blur-image.loaded`

**Cómo funciona:**
```css
.blur-image {
    filter: blur(10px);
    transition: filter 0.5s ease-out;
}

.blur-image.loaded {
    filter: blur(0);
}
```

### 3. **Atributo loading="lazy"**
- Soporte nativo del navegador para lazy loading
- Funciona en paralelo con IntersectionObserver
- Navegadores que lo soportan lo usan automáticamente

## Impacto en Rendimiento

### Antes:
- Cargar 30 imágenes simultáneamente
- Tiempo de carga inicial más lento
- Mayor uso de ancho de banda

### Después:
- Solo cargan imágenes visibles + 50px adelante
- Carga progresiva conforme el usuario navega
- Reducción de ~60-80% en datos iniciales descargados
- Mejor experiencia en conexiones lentas

## Recomendaciones Adicionales

Para mejorar aún más el rendimiento con muchas imágenes:

1. **Convertir imágenes a WebP**
   - Archivos 25-35% más pequeños que JPG
   - Fallback a JPG para navegadores antiguos

2. **Responsive Images (srcset)**
   - Servir diferentes tamaños según dispositivo
   - Reducir datos en móviles

3. **Compression**
   - Usar TinyPNG, ImageOptim o similar
   - Comprimir sin perder calidad visual

4. **Content Delivery Network (CDN)**
   - Servir imágenes desde ubicación cercana al usuario
   - Cloudinary, Imgix, o Amazon CloudFront

## Probar Rendimiento

En Chrome DevTools:
1. F12 → Network tab
2. Throttle a "Fast 3G" o "Slow 3G"
3. Reload página
4. Observar cómo las imágenes cargan con blur-up effect

## Código Relevante

### catalog.js
```javascript
// Placeholder borroso
function createBlurPlaceholder(color = '#EC407A') {
    const svg = `...`;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Lazy loading
function setupLazyLoadingWithBlur() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.lazySrc;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    // ...
}
```

### Uso en renderCatalog
```html
<img src="[SVG BLUR]" 
     data-lazy-src="[IMAGE URL]" 
     class="blur-image"
     loading="lazy" />
```
