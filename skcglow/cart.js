// =========================
// CARRITO SKC GLOW (módulo)
// =========================

import { CONFIG } from './config.js';

let cart = [];
try {
    const storedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
    cart = storedCart ? JSON.parse(storedCart) : [];
} catch (e) {
    console.warn('No se pudo leer skcCart desde localStorage', e);
    cart = [];
}

// Guardar en localStorage
function saveCart() {
    try {
        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.warn('No se pudo guardar skcCart en localStorage', e);
    }
}

// Agregar producto
export function addToCart(product) {
    if (!product) return;
    const exists = cart.find((p) => p.id === product.id);

    if (exists) {
        exists.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    renderCart();
}

// Quitar solo 1 unidad
export function decreaseQty(id) {
    const item = cart.find((p) => p.id === id);
    if (!item) return;

    if (item.quantity > 1) {
        item.quantity--;
    } else {
        cart = cart.filter((p) => p.id !== id);
    }

    saveCart();
    renderCart();
}

// Eliminar completamente
export function removeFromCart(id) {
    cart = cart.filter((p) => p.id !== id);
    saveCart();
    renderCart();
}

// Vaciar todo
export function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

// Calcular total
export function cartTotal() {
    return cart.reduce((sum, p) => sum + p.price * p.quantity, 0);
}

// Actualizar el contador del carrito en el botón
function updateCartCount() {
    const badges = document.querySelectorAll('.cart-count-badge');
    if (!badges.length) return;
    const totalItems = cart.reduce((sum, p) => sum + p.quantity, 0);
    badges.forEach((badge) => {
        badge.textContent = totalItems;
    });
}

// Compatibilidad con `cart-view-js` y otras utilidades
export function getCart() {
    return cart;
}

// Renderizar carrito con delegación de eventos
export function renderCart() {
    const container = document.getElementById("cartItems");
    const total = document.getElementById("cartTotal");

    if (!container || !total) return;

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                <p class="text-gray-700 font-semibold">Tu carrito está vacío</p>
                <p class="text-sm text-gray-500 mt-1">Agrega productos del catálogo para comenzar tu compra.</p>
            </div>
        `;
        total.textContent = "$0";
        updateCartCount();
        return;
    }

    cart.forEach((p) => {
        const item = document.createElement("div");
        item.className = "bg-white border border-gray-200 p-3 rounded-2xl shadow-sm hover:shadow-md transition";

        item.innerHTML = `
            <div class="flex items-start gap-3">
                <img
                    src="${p.image || './assets/default.png'}"
                    onerror="this.src='./assets/default.png'; this.onerror=null;"
                    alt="${p.name}"
                    class="w-16 h-16 rounded-xl object-cover border border-gray-200"
                />

                <div class="flex-1 min-w-0">
                    <p class="font-bold text-[#6d165a] leading-tight line-clamp-2">${p.name}</p>
                    <p class="text-lg font-extrabold text-[#a0346e] mt-1">$${p.price.toLocaleString()}</p>
                    <p class="text-xs text-gray-600 mt-1">Cantidad: ${p.quantity}</p>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <div class="flex items-center gap-2">
                        <button class="inc-btn bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white px-3 py-1 rounded-lg font-bold" data-id="${p.id}" data-action="inc">+</button>
                        <button class="dec-btn bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded-lg font-bold" data-id="${p.id}" data-action="dec">−</button>
                    </div>
                    <button class="remove-btn text-[#a0346e] text-sm hover:underline" data-id="${p.id}" data-action="remove">Eliminar</button>
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    total.textContent = "$" + cartTotal().toLocaleString();

    container.removeEventListener('click', onCartClick);
    container.addEventListener('click', onCartClick);

    // Actualizar el contador en el botón del carrito
    updateCartCount();
}

function onCartClick(e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const action = btn.dataset.action;

    if (action === "inc") {
        const item = cart.find(p => p.id === id);
        if (item) {
            item.quantity++;
            saveCart();
            renderCart();
        }
    } else if (action === "dec") {
        decreaseQty(id);
    } else if (action === "remove") {
        removeFromCart(id);
    }
}

// =========================
// WHATSAPP + SIDEBAR
// =========================

const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        const phone = CONFIG.WHATSAPP_PHONE;

            let message = "Hola! Quisiera comprar estos productos:%0A%0A";

            cart.forEach((p) => {
                message += `• ${p.name} (x${p.quantity}) - $${p.price.toLocaleString()}%0A`;
            });

            message += `%0ATotal: $${cartTotal().toLocaleString()}`;

            window.open(`https://wa.me/${phone}?text=${message}`);
        });
    }

const sidebar = document.getElementById("cartSidebar");
const openCartBtns = document.querySelectorAll('.open-cart-btn');
const closeCartBtn = document.getElementById("closeCart");
const clearCartBtn = document.getElementById("clearCart");

if (sidebar) {
    openCartBtns.forEach((btn) => {
        btn.onclick = () => sidebar.classList.remove("translate-x-full");
    });
}
if (closeCartBtn && sidebar) closeCartBtn.onclick = () => sidebar.classList.add("translate-x-full");
if (clearCartBtn) clearCartBtn.onclick = clearCart;

// Render inicial
renderCart();

// Función de comodidad para abrir el carrito desde el menú u otros lugares
export function carrito() {
    if (sidebar) sidebar.classList.remove("translate-x-full");
    else if (openCartBtns.length > 0) openCartBtns[0].click();
}

// Exponer en `window` para compatibilidad con enlaces inline como `javascript:carrito()`
try {
    window.carrito = carrito;
} catch (e) {
    // en entornos sin window (tests), ignorar
}
