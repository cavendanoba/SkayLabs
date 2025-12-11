import { products } from './products.js';

// Cargar catálogo desde localStorage si existe, si no usar products.js
const stored = localStorage.getItem('skcCatalog');
let catalog = stored ? JSON.parse(stored) : [...products];

const panel = document.getElementById('admin-panel');

function saveCatalog() {
    localStorage.setItem('skcCatalog', JSON.stringify(catalog));
}

function renderAdminPanel() {
    panel.innerHTML = `
        <div class="flex gap-2 mb-4">
            <button class="px-4 py-2 bg-[#EC407A] text-white rounded" id="add-product">Agregar producto</button>
            <button class="px-4 py-2 bg-[#10B981] text-white rounded" id="register-sale">Registrar venta</button>
        </div>
        <table class="w-full text-sm border">
            <thead>
                <tr class="bg-[#F8BBD0]">
                    <th class="p-2">ID</th>
                    <th class="p-2">Nombre</th>
                    <th class="p-2">Precio</th>
                    <th class="p-2">Stock</th>
                    <th class="p-2">Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${catalog.map(p => `
                    <tr class="border-b">
                        <td class="p-2">${p.id}</td>
                        <td class="p-2">${p.name}</td>
                        <td class="p-2">$${p.price.toLocaleString()}</td>
                        <td class="p-2">${p.stock}</td>
                        <td class="p-2 flex gap-2">
                            <button class="px-2 py-1 bg-yellow-400 rounded edit-btn" data-id="${p.id}">Editar</button>
                            <button class="px-2 py-1 bg-red-400 text-white rounded delete-btn" data-id="${p.id}">Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('add-product').onclick = () => showAddProduct();
    document.getElementById('register-sale').onclick = () => showRegisterSale();
    panel.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => showEditProduct(btn.dataset.id));
    panel.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deleteProduct(btn.dataset.id));
}

function showAddProduct() {
    Swal.fire({
        title: 'Agregar producto',
        html: `
            <input id="swal-name" class="swal2-input" placeholder="Nombre">
            <input id="swal-price" class="swal2-input" type="number" placeholder="Precio">
            <input id="swal-stock" class="swal2-input" type="number" placeholder="Stock">
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        preConfirm: () => {
            const name = document.getElementById('swal-name').value;
            const price = parseInt(document.getElementById('swal-price').value);
            const stock = parseInt(document.getElementById('swal-stock').value);
            if (!name || isNaN(price) || isNaN(stock)) {
                Swal.showValidationMessage('Todos los campos son obligatorios');
                return false;
            }
            return { name, price, stock };
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            const newId = Math.max(...catalog.map(p => p.id)) + 1;
            catalog.push({ id: newId, name: result.value.name, price: result.value.price, stock: result.value.stock });
            saveCatalog();
            renderAdminPanel();
            Swal.fire('Agregado', 'Producto agregado correctamente', 'success');
        }
    });
}

function showEditProduct(id) {
    const product = catalog.find(p => p.id == id);
    if (!product) return;
    Swal.fire({
        title: 'Editar producto',
        html: `
            <input id="swal-name" class="swal2-input" value="${product.name}" placeholder="Nombre">
            <input id="swal-price" class="swal2-input" type="number" value="${product.price}" placeholder="Precio">
            <input id="swal-stock" class="swal2-input" type="number" value="${product.stock}" placeholder="Stock">
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        preConfirm: () => {
            const name = document.getElementById('swal-name').value;
            const price = parseInt(document.getElementById('swal-price').value);
            const stock = parseInt(document.getElementById('swal-stock').value);
            if (!name || isNaN(price) || isNaN(stock)) {
                Swal.showValidationMessage('Todos los campos son obligatorios');
                return false;
            }
            return { name, price, stock };
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            product.name = result.value.name;
            product.price = result.value.price;
            product.stock = result.value.stock;
            saveCatalog();
            renderAdminPanel();
            Swal.fire('Guardado', 'Producto actualizado', 'success');
        }
    });
}

function deleteProduct(id) {
    Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#EC407A',
        cancelButtonColor: '#999',
    }).then(result => {
        if (result.isConfirmed) {
            catalog = catalog.filter(p => p.id != id);
            saveCatalog();
            renderAdminPanel();
            Swal.fire('Eliminado', 'Producto eliminado', 'success');
        }
    });
}

// Registrar una venta: seleccionar producto y cantidad, disminuir stock y guardar
function showRegisterSale() {
    const options = catalog.map(p => `<option value="${p.id}">${p.name} (stock: ${p.stock})</option>`).join('');

    Swal.fire({
        title: 'Registrar venta',
        html: `
            <select id="swal-prod" class="swal2-input">${options}</select>
            <input id="swal-qty" class="swal2-input" type="number" min="1" value="1" placeholder="Cantidad vendida">
        `,
        showCancelButton: true,
        confirmButtonText: 'Registrar',
        preConfirm: () => {
            const id = parseInt(document.getElementById('swal-prod').value, 10);
            const qty = parseInt(document.getElementById('swal-qty').value, 10);
            if (isNaN(id) || isNaN(qty) || qty <= 0) {
                Swal.showValidationMessage('Selecciona producto y cantidad válida');
                return false;
            }
            return { id, qty };
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            const { id, qty } = result.value;
            const prod = catalog.find(p => p.id === id);
            if (!prod) return Swal.fire('Error', 'Producto no encontrado', 'error');

            const prevStock = prod.stock;
            prod.stock = Math.max(0, prod.stock - qty);
            saveCatalog();
            renderAdminPanel();

            Swal.fire('Venta registrada', `${prod.name}: ${qty} unidad(es) vendida(s). Stock: ${prevStock} → ${prod.stock}`, 'success');

            if (prod.stock < 2) {
                Swal.fire({
                    icon: 'warning',
                    title: '¡Stock bajo!',
                    text: `Queda poco stock de ${prod.name} (${prod.stock} unidades)`,
                    confirmButtonColor: '#EC407A'
                });
            }
        }
    });
}

renderAdminPanel();
