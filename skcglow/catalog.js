// catalog.js
import { products as fallbackProducts } from "./products.js";
import { addToCart } from "./cart.js";
import { createProductCard } from "./components/productCard.js";

// Obtener catálogo actual (prefiere localStorage si fue modificado desde admin)
function getCatalog() {
    try {
        const s = localStorage.getItem('skcCatalog');
        if (s) return JSON.parse(s);
    } catch (e) {
        console.warn('No se pudo leer skcCatalog desde localStorage', e);
    }
    // fallback a datos cargados via fetch o al array local
    return window.__SKC_CATALOG__ || fallbackProducts;
}

// Expose a getter globally so components (filters) can access catalog without circular imports
if (typeof window !== 'undefined') {
    window.getCatalog = getCatalog;
}

// Intentar cargar data/products.json en window.__SKC_CATALOG__ (async)
fetch('/skcglow/data/products.json').then(r => {
    if (r.ok) return r.json();
    throw new Error('No data');
}).then(data => {
    window.__SKC_CATALOG__ = data;
}).catch(() => {
    // si falla, window.__SKC_CATALOG__ no se establece y se usará fallback
    console.warn('No fue posible cargar data/products.json — usando fallback');
});

// Función para manejar el fallback de imágenes
function handleImageError(img) {
    img.src = 'assets/default.png';
    img.onerror = null; // Evita loop infinito
}

// Exponer fallback globalmente por si aún hay handlers inline en el HTML
if (typeof window !== 'undefined') {
    window.handleImageError = function(img) {
        img.src = 'assets/default.png';
        img.onerror = null;
    };
}

// Crear un placeholder borroso (blur-up effect)
function createBlurPlaceholder(color = '#EC407A') {
    // Retorna un SVG base64 que actúa como placeholder borroso
    const svg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
                </filter>
            </defs>
            <rect width="400" height="400" fill="${color}" opacity="0.3" filter="url(#blur)"/>
        </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Observar imágenes para lazy loading con blur-up
function setupLazyLoadingWithBlur() {
    const images = document.querySelectorAll('img[data-lazy-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.lazySrc;
                    img.removeAttribute('data-lazy-src');
                    img.classList.add('loaded'); // Trigger fade-in animation
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Cargar 50px antes de ser visible
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback para navegadores sin IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.lazySrc;
            img.removeAttribute('data-lazy-src');
        });
    }
}

// Función para mostrar el modal del producto con SweetAlert2
export function showProductModal(productId, cartCallback) {
    const product = getCatalog().find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
        title: product.name,
        html: `
            <div class="text-center px-4">
                 <img src="${product.image || 'assets/default.png'}" 
                     alt="${product.name}" 
                     class="mx-auto rounded-lg max-h-96 w-auto block my-4"
                     onerror="this.src='assets/default.png'">
                <p class="text-sm text-gray-600 my-4">${product.description || 'Sin descripción disponible'}</p>
                ${product.reviews ? product.reviews.map(r => `<div class="mt-2 p-2 bg-gray-100 rounded text-left"><strong>${r.user}:</strong> ⭐ ${r.rating}/5 - ${r.comment}</div>`).join('') : '<p class="text-sm text-gray-500">Sin reseñas aún.</p>'}
                <p class="font-semibold text-[#EC407A] my-2">Precio: $${product.price.toLocaleString()}</p>
                <p class="text-sm text-gray-500">Stock disponible: ${product.stock}</p>
            </div>
        `,
        // icon: 'info',
        confirmButtonText: 'Agregar al carrito',
        cancelButtonText: 'Cerrar',
        showCancelButton: true,
        confirmButtonColor: '#EC407A',
        cancelButtonColor: '#999',
    }).then((result) => {
        if (result.isConfirmed) {
            if (cartCallback) cartCallback(product);
            Swal.fire({
                icon: 'success',
                title: '¡Agregado!',
                text: `${product.name} fue agregado al carrito`,
                timer: 2000
            });
        }
    });
}

// Renderiza los productos en un contenedor (grid)
export function renderCatalog(containerId, options = {}) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("No existe el contenedor del catálogo:", containerId);
        return;
    }

    container.innerHTML = ""; // Limpia por si se recarga

    // Aplicar filtros proporcionados en options (search, category, priceRange)
    let catalog = getCatalog();
    const { search = '', category = 'all', priceMin = 0, priceMax = Infinity } = options;

    if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        catalog = catalog.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    if (category && category !== 'all') {
        catalog = catalog.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    catalog = catalog.filter(p => (p.price || 0) >= priceMin && (p.price || 0) <= priceMax);
    catalog.forEach(product => {
        // normalize image path to allow fetch from /skcglow/
        const imgPath = (product.image || 'assets/default.png').replace(/^\//, '');
        const placeholder = createBlurPlaceholder('#EC407A');
        const card = createProductCard(product, placeholder, imgPath);
        container.appendChild(card);
    });

    // Mostrar contador de resultados
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = `Mostrando ${catalog.length} productos`;
    }

    // Mostrar botón de cargar más si hay productos
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer && catalog.length > 0) {
        loadMoreContainer.classList.remove('hidden');
    }

    // Use a single onclick handler (replaces previous listeners on re-renders)
    container.onclick = (e) => {
        const btn = e.target.closest('.add-btn');
        const img = e.target.closest('img');

        // Si se clickea en la imagen, abrir modal
        if (img && img.dataset.productId) {
            e.stopPropagation();
            showProductModal(parseInt(img.dataset.productId, 10), addToCart);
            return;
        }

        // Si se clickea en el botón "Agregar al carrito"
        if (!btn) return;
        const id = parseInt(btn.dataset.id, 10);
        const product = getCatalog().find(p => p.id === id);
        if (product) {
            addToCart(product);
            if (product.stock < 2) {
                Swal.fire({
                    icon: 'warning',
                    title: '¡Stock bajo!',
                    text: `Queda poco stock de ${product.name} (${product.stock} unidades)`,
                    confirmButtonColor: '#EC407A'
                });
            }
        }
    };
    
    // Inicializar lazy loading con blur-up
    setupLazyLoadingWithBlur();
}

// Utilidades para UI de filtros
// setupFilters moved to components/filters.js to keep catalog rendering focused
