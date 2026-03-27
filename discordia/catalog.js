// catalog.js
import { products } from "./products.js";
import { addToCart } from "./cart.js";
import { CONFIG } from "./config.js";

const catalogUiState = {
    search: '',
    onlyInStock: false,
    sort: 'featured'
};

let lastContainerId = null;
let controlsBound = false;

// Obtener catálogo actual (prefiere localStorage si fue modificado desde admin)
export function getCatalog() {
    try {
        const s = localStorage.getItem(CONFIG.CATALOG_STORAGE_KEY);
        if (s) return JSON.parse(s);
    } catch (e) {
        console.warn('No se pudo leer skcCatalog desde localStorage', e);
    }
    return products;
}

function getFilteredCatalog() {
    let items = [...getCatalog()];

    if (catalogUiState.search.trim()) {
        const term = catalogUiState.search.trim().toLowerCase();
        items = items.filter((product) => {
            const haystack = `${product.name} ${product.description || ''}`.toLowerCase();
            return haystack.includes(term);
        });
    }

    if (catalogUiState.onlyInStock) {
        items = items.filter((product) => product.stock > 0);
    }

    if (catalogUiState.sort === 'price-asc') {
        items.sort((a, b) => a.price - b.price);
    } else if (catalogUiState.sort === 'price-desc') {
        items.sort((a, b) => b.price - a.price);
    } else if (catalogUiState.sort === 'stock-desc') {
        items.sort((a, b) => b.stock - a.stock);
    } else if (catalogUiState.sort === 'newest') {
        items.sort((a, b) => b.id - a.id);
    }

    return items;
}

// Función para manejar el fallback de imágenes
function handleImageError(img) {
    img.src = './assets/default.png';
    img.onerror = null; // Evita loop infinito
}

// Exponer fallback globalmente por si aún hay handlers inline en el HTML
if (typeof window !== 'undefined') {
    window.handleImageError = function(img) {
        img.src = './assets/default.png';
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

function getRatingForProduct(productId) {
    const rating = 4 + ((productId % 3) * 0.3);
    return Math.min(5, Math.round(rating * 10) / 10);
}

function renderStars(rating) {
    return '★★★★★';
}

function bindCatalogControls() {
    if (controlsBound) return;

    const searchInput = document.getElementById('catalogSearch');
    const stockFilter = document.getElementById('filterInStock');
    const sortSelect = document.getElementById('sortProducts');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            catalogUiState.search = e.target.value;
            if (lastContainerId) renderCatalog(lastContainerId);
        });
    }

    if (stockFilter) {
        stockFilter.addEventListener('change', (e) => {
            catalogUiState.onlyInStock = e.target.checked;
            if (lastContainerId) renderCatalog(lastContainerId);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            catalogUiState.sort = e.target.value;
            if (lastContainerId) renderCatalog(lastContainerId);
        });
    }

    controlsBound = true;
}

function updateResultsCount(totalVisible, totalCatalog) {
    const countNode = document.getElementById('resultsCount');
    if (!countNode) return;
    countNode.textContent = `Mostrando ${totalVisible} de ${totalCatalog} productos`;
}

function getCardLayout(index) {
    const patternIndex = index % 8;
    const isSpotlight = patternIndex === 0;
    const isFeature = patternIndex === 3;

    if (isSpotlight) {
        return {
            cardClass: 'sm:col-span-2 lg:col-span-2',
            imageHeight: '360px',
            titleClass: 'text-[17px]',
            priceClass: 'text-[30px]',
            badge: 'Selección DISCORDIA'
        };
    }

    if (isFeature) {
        return {
            cardClass: 'sm:col-span-2',
            imageHeight: '330px',
            titleClass: 'text-[16px]',
            priceClass: 'text-[27px]',
            badge: 'Tendencia'
        };
    }

    return {
        cardClass: '',
        imageHeight: '280px',
        titleClass: 'text-[15px]',
        priceClass: 'text-2xl',
        badge: 'Favorito'
    };
}

// Función para mostrar el modal del producto con SweetAlert2
export function showProductModal(productId, cartCallback) {
    const product = getCatalog().find(p => p.id === productId);
    if (!product) return;

    Swal.fire({
        title: product.name,
        html: `
            <div style="text-align: center;">
                 <img src="${product.image || './assets/default.png'}" 
                     alt="${product.name}" 
                     style="max-width: 100%; max-height: 400px; border-radius: 10px; margin: 10px auto; display: block;"
                     onerror="this.src='./assets/default.png'">
                <p style="margin: 15px 0; font-size: 14px; color: #666;">${product.description || 'Sin descripción disponible'}</p>
                <p style="font-weight: bold; color: #a0346e; margin: 10px 0; font-size: 1.125rem;">Precio: $${product.price.toLocaleString()}</p>
                <p style="margin: 5px 0; font-size: 13px;">Stock disponible: ${product.stock}</p>
            </div>
        `,
        // icon: 'info',
        confirmButtonText: 'Agregar al carrito',
        cancelButtonText: 'Cerrar',
        showCancelButton: true,
        confirmButtonColor: '#ec5c8d',
        cancelButtonColor: '#999',
    }).then((result) => {
        if (result.isConfirmed) {
            if (cartCallback) cartCallback(product);
            Swal.fire({
                icon: 'success',
                title: '¡Agregado!',
                text: `${product.name} fue agregado al carrito`,
                timer: 2000,
                confirmButtonColor: '#ec5c8d'
            });
        }
    });
}

// Renderiza los productos en un contenedor (grid)
export function renderCatalog(containerId) {
    const container = document.getElementById(containerId);
    lastContainerId = containerId;
    bindCatalogControls();

    if (!container) {
        console.error("No existe el contenedor del catálogo:", containerId);
        return;
    }

    container.innerHTML = ""; // Limpia por si se recarga

    const fullCatalog = getCatalog();
    const catalog = getFilteredCatalog();
    updateResultsCount(catalog.length, fullCatalog.length);

    if (catalog.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p class="text-lg font-semibold text-gray-800">No encontramos productos con esos filtros</p>
                <p class="text-sm text-gray-600 mt-2">Prueba otra búsqueda o desactiva el filtro de stock.</p>
            </div>
        `;
        return;
    }

    catalog.forEach((product, index) => {
        const rating = getRatingForProduct(product.id);
        const reviews = 18 + ((product.id * 7) % 90);
        const isLowStock = product.stock > 0 && product.stock <= 3;
        const isOutOfStock = product.stock <= 0;
        const layout = getCardLayout(index);
        const stockBadge = isOutOfStock
            ? '<span class="absolute top-3 left-3 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">Agotado</span>'
            : (isLowStock
                ? '<span class="absolute top-3 left-3 bg-[#EC407A] text-white text-xs font-bold px-2 py-1 rounded-full">Últimas unidades</span>'
                : `<span class="absolute top-3 left-3 bg-white/90 text-[#a0346e] text-xs font-bold px-2 py-1 rounded-full">${layout.badge}</span>`);

        const card = document.createElement("div");
        card.className = `bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-100 overflow-hidden ${layout.cardClass}`;
        card.style.cursor = "pointer";
        card.dataset.productId = product.id;

        card.innerHTML = `
            <div class="relative">
                ${stockBadge}
                <img src="${createBlurPlaceholder('#EC407A')}" 
                    data-lazy-src="${product.image || './assets/default.png'}" 
                    class="w-full object-cover cursor-pointer hover:opacity-90 transition blur-image" 
                    alt="${product.name}" 
                    onerror="this.src='./assets/default.png'; this.onerror=null;" 
                    data-product-id="${product.id}" 
                    loading="lazy"
                        style="cursor: pointer; height: ${layout.imageHeight};">
            </div>

            <div class="p-4 flex flex-col">
                <div>
                    <h4 class="font-bold ${layout.titleClass} text-gray-900 leading-snug">${product.name}</h4>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="text-yellow-400 text-sm">${renderStars(rating)}</span>
                        <span class="text-xs text-gray-500">(${reviews})</span>
                    </div>

                    <div class="mt-3 flex items-end justify-between">
                        <p class="font-extrabold ${layout.priceClass} text-[#a0346e]">$${product.price.toLocaleString()}</p>
                        <p class="text-xs text-gray-600">Stock: ${product.stock}</p>
                    </div>
                </div>

                <button class="button small w-full mt-3 add-btn ${isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''}" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
                    Agregar al carrito
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    // Delegación de eventos para los botones
    container.removeEventListener("click", onCatalogClick);
    container.addEventListener("click", onCatalogClick);
    
    // Inicializar lazy loading con blur-up
    setupLazyLoadingWithBlur();
}

function onCatalogClick(e) {
    const btn = e.target.closest(".add-btn");
    const img = e.target.closest("img");

    if (img && img.dataset.productId) {
        e.stopPropagation();
        showProductModal(parseInt(img.dataset.productId, 10), addToCart);
        return;
    }

    if (!btn) return;
    if (btn.disabled) return;
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
}
