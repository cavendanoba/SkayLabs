// components/productCard.js
// Small reusable product card factory. Returns a DOM element.
export function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function createProductCard(product, placeholderSrc, imgPath) {
    const card = document.createElement('div');
    card.className = "bg-[#F8BBD0] rounded-2xl shadow-xl p-6 text-black border border-yellow-200 flex flex-col h-full";
    card.style.cursor = "pointer";
    card.dataset.productId = product.id;

    const name = escapeHtml(product.name || '');
    const category = escapeHtml(product.category || '');
    const alt = escapeHtml(product.name || 'Producto');

    const avgRating = product.reviews ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1) : 0;
    const reviewCount = product.reviews ? product.reviews.length : 0;
    const stars = '⭐'.repeat(Math.floor(avgRating));

    card.innerHTML = `
        <img src="${placeholderSrc}" 
            data-lazy-src="/skcglow/${imgPath}" 
            class="w-full object-cover rounded-xl mb-4 cursor-pointer hover:opacity-80 transition blur-image h-72 md:h-80" 
            alt="${alt}" 
            onerror="this.src='/skcglow/assets/default.png'; this.onerror=null;" 
            data-product-id="${product.id}" 
            loading="lazy">
        <div class="flex-1 flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between">
                    <h4 class="font-bold text-lg">${name}</h4>
                    <span class="text-xs bg-[#fff3f6] text-[#a0346e] px-2 py-1 rounded-full font-semibold">${category}</span>
                </div>
                <p class="text-sm text-gray-700 mt-2">Stock: ${product.stock}</p>
                <p class="font-bold text-xl mt-2 text-[#EC407A]">$${(product.price || 0).toLocaleString()}</p>
                ${reviewCount > 0 ? `<div class="flex items-center mt-2"><span class="text-yellow-400 text-sm">${stars}</span><span class="text-xs text-gray-600 ml-1">(${reviewCount} reseñas)</span></div>` : ''}
            </div>
            <button class="w-full mt-4 add-btn bg-gradient-to-r from-[#ec5c8d] to-[#ff8c91] text-white font-bold py-2 rounded-lg hover:from-[#ff8c91] hover:to-[#ffc4a6] transition" data-id="${product.id}">
                Agregar al carrito
            </button>
        </div>
    `;

    return card;
}
