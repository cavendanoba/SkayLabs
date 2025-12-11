// catalog.js
import { products } from "./products.js";
import { addToCart } from "./cart.js";

// Obtener catálogo actual (prefiere localStorage si fue modificado desde admin)
function getCatalog() {
    try {
        const s = localStorage.getItem('skcCatalog');
        if (s) return JSON.parse(s);
    } catch (e) {
        console.warn('No se pudo leer skcCatalog desde localStorage', e);
    }
    return products;
}

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
            <div style="text-align: center;">
                 <img src="${product.image || 'assets/default.png'}" 
                     alt="${product.name}" 
                     style="max-width: 100%; max-height: 400px; border-radius: 10px; margin: 10px auto; display: block;"
                     onerror="this.src='assets/default.png'">
                <p style="margin: 15px 0; font-size: 14px; color: #666;">${product.description || 'Sin descripción disponible'}</p>
                <p style="font-weight: bold; color: #EC407A; margin: 10px 0; font-size: 1.125rem;">Precio: $${product.price.toLocaleString()}</p>
                <p style="margin: 5px 0; font-size: 13px;">Stock disponible: ${product.stock}</p>
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
export function renderCatalog(containerId) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("No existe el contenedor del catálogo:", containerId);
        return;
    }

    container.innerHTML = ""; // Limpia por si se recarga

    const catalog = getCatalog();
    catalog.forEach(product => {
        const card = document.createElement("div");
        card.className = "bg-[#F8BBD0] rounded-2xl shadow-xl p-4 text-black border border-yellow-200 flex flex-col h-full";
        card.style.cursor = "pointer";
        card.dataset.productId = product.id;

        card.innerHTML = `
              <img src="${createBlurPlaceholder('#EC407A')}" 
                  data-lazy-src="${product.image || 'assets/default.png'}" 
                 class="w-full object-cover rounded-xl mb-3 cursor-pointer hover:opacity-80 transition blur-image" 
                 alt="${product.name}" 
                 onerror="this.src='assets/default.png'; this.onerror=null;" 
                 data-product-id="${product.id}" 
                 loading="lazy"
                 style="cursor: pointer; height: calc(8rem * 1.05);">
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-start justify-between">
                        <h4 class="font-bold text-lg">${product.name}</h4>
                        <p class="font-bold text-xl mt-0 text-[#EC407A]">$${product.price.toLocaleString()}</p>
                    </div>
                    <p class="text-sm text-gray-700 mt-2">${product.description || 'Sin descripción'}</p>
                    <p class="text-sm text-gray-700">Stock: ${product.stock}</p>
                </div>
                <button class="button small w-full mt-4 add-btn" data-id="${product.id}">
                    Agregar al carrito
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    // Delegación de eventos para los botones
    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-btn");
        const img = e.target.closest("img");

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
    });
    
    // Inicializar lazy loading con blur-up
    setupLazyLoadingWithBlur();
}
