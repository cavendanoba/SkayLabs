// =========================
// CARRITO SKC GLOW (módulo)
// =========================

let cart = JSON.parse(localStorage.getItem("skcCart")) || [];

// Guardar en localStorage
function saveCart() {
    localStorage.setItem("skcCart", JSON.stringify(cart));
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
    const cartCountBadge = document.getElementById("cartCount");
    if (cartCountBadge) {
        const totalItems = cart.reduce((sum, p) => sum + p.quantity, 0);
        cartCountBadge.textContent = totalItems;
    }
}

// Compatibilidad con `cart-view-js` y otras utilidades
export function getCart() {
    return cart;
}

export function getCartTotal() {
    return cartTotal();
}

export function decreaseFromCart(id) {
    return decreaseQty(id);
}

// Renderizar carrito con delegación de eventos
export function renderCart() {
    const container = document.getElementById("cartItems");
    const total = document.getElementById("cartTotal");

    if (!container || !total) return;

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-gray-300">Tu carrito está vacío</p>`;
        total.textContent = "$0";
        return;
    }

    cart.forEach((p) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl shadow-md";

        item.innerHTML = `
            <div>
                <p class="font-bold text-[#F8BBD0]">${p.name}</p>
                <p class="text-sm text-gray-400">$${p.price.toLocaleString()}</p>
                <p class="text-sm text-gray-300">Cantidad: ${p.quantity}</p>
            </div>

            <div class="flex flex-col gap-2">
                <button class="inc-btn bg-[#EC407A] text-black px-2 py-1 rounded-lg" data-id="${p.id}" data-action="inc">+</button>
                <button class="dec-btn bg-gray-700 px-2 py-1 rounded-lg" data-id="${p.id}" data-action="dec">-</button>
                <button class="remove-btn text-red-400 text-sm" data-id="${p.id}" data-action="remove">Eliminar</button>
            </div>
        `;

        container.appendChild(item);
    });

    total.textContent = "$" + cartTotal().toLocaleString();

    // eventos de botones dentro del contenedor
    container.onclick = (e) => {
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
    };

    // Actualizar el contador en el botón del carrito
    updateCartCount();
}

// =========================
// WHATSAPP + SIDEBAR
// =========================

const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        const phone = "573508311346"; // Número de WhatsApp del negocio

        let message = "Hola! Quisiera comprar estos productos:%0A%0A";

        cart.forEach((p) => {
            message += `• ${p.name} (x${p.quantity}) - $${p.price.toLocaleString()}%0A`;
        });

        message += `%0ATotal: $${cartTotal().toLocaleString()}`;

        window.open(`https://wa.me/${phone}?text=${message}`);
    });
}

const sidebar = document.getElementById("cartSidebar");
const openCartBtn = document.getElementById("openCart");
const closeCartBtn = document.getElementById("closeCart");
const clearCartBtn = document.getElementById("clearCart");

if (openCartBtn && sidebar) openCartBtn.onclick = () => sidebar.classList.remove("translate-x-full");
if (closeCartBtn && sidebar) closeCartBtn.onclick = () => sidebar.classList.add("translate-x-full");
if (clearCartBtn) clearCartBtn.onclick = clearCart;

// Render inicial
renderCart();

// Función de comodidad para abrir el carrito desde el menú u otros lugares
export function carrito() {
    if (sidebar) sidebar.classList.remove("translate-x-full");
    else if (openCartBtn) openCartBtn.click();
}

// Exponer en `window` para compatibilidad con enlaces inline como `javascript:carrito()`
try {
    window.carrito = carrito;
} catch (e) {
    // en entornos sin window (tests), ignorar
}
