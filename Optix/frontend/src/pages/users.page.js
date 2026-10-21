// frontend/src/pages/users.page.js
import usersService from '../services/users.service.js';
import DataTable from '../components/table.component.js';
import Modal from '../components/modal.component.js';
import Toast from '../components/toast.component.js';
import renderBadge from '../components/badge.component.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';
import authService from '../services/auth.service.js';

const columns = [
  {
    header: 'Usuario',
    key: 'name',
    render: (row) => `
      <div class="cell-patient">
        <div class="cell-avatar">${row.name[0]}</div>
        <div>
          <div class="fw-600">${row.name}</div>
          <div class="text-muted text-sm">${row.email}</div>
        </div>
      </div>
    `,
  },
  { header: 'Rol', key: 'role', render: (row) => renderBadge(row.role) },
  {
    header: 'Especialidad',
    key: 'specialty',
    render: (row) => row.specialty || '—',
  },
  {
    header: 'Estado',
    key: 'active',
    render: (row) => renderBadge(row.active ? 'active' : 'inactive'),
  },
  {
    header: 'Creado',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt).toLocaleDateString('es-CO'),
  },
];

let tableInstance = null;
let usersData = [];

async function loadUsers() {
  try {
    tableInstance?.showLoading();
    const data = await usersService.list();
    usersData = data;
    tableInstance?.render({ data, total: data.length, page: 1, pages: 1 });
  } catch (err) {
    Toast.error('Error al cargar usuarios');
  }
}

function renderCreateModal() {
  const modal = new Modal({ title: 'Nuevo Usuario', size: 'md' });

  const formHTML = `
    <form id="user-form" class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Nombre completo *</label>
        <input type="text" name="name" class="form-control" required placeholder="Nombre del usuario" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Email *</label>
        <input type="email" name="email" class="form-control" required placeholder="correo@optix.co" />
      </div>
      <div class="form-group">
        <label class="form-label">Contraseña *</label>
        <input type="password" name="password" class="form-control" required placeholder="Mínimo 8 caracteres" minlength="8" />
      </div>
      <div class="form-group">
        <label class="form-label">Rol *</label>
        <select name="role" class="form-control" required>
          <option value="RECEPTIONIST">Recepcionista</option>
          <option value="DOCTOR">Médico</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Especialidad</label>
        <input type="text" name="specialty" class="form-control" placeholder="Ej: Oftalmología" />
      </div>
      <div class="form-group">
        <label class="form-label">No. de licencia</label>
        <input type="text" name="licenseNumber" class="form-control" placeholder="Ej: OFT-12345" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" placeholder="Teléfono de contacto" />
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-user">Cancelar</button>
    <button type="submit" form="user-form" class="btn btn-primary" id="save-user">Crear usuario</button>
  `;

  modal.render(formHTML, footerHTML);

  document.getElementById('cancel-user')?.addEventListener('click', () => modal.close());
  document.getElementById('user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-user');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    Object.keys(data).forEach((k) => { if (!data[k]) delete data[k]; });

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Creando...';
      await usersService.create(data);
      Toast.success('Usuario creado exitosamente');
      modal.close();
      loadUsers();
    } catch (err) {
      Toast.error(err.message || 'Error al crear el usuario');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Crear usuario';
    }
  });
}

async function handleRowClick(id) {
  const user = usersData.find((u) => u.id === id);
  if (!user) return;

  const currentUser = authService.getLocalUser();
  if (user.id === currentUser?.id) {
    Toast.info('No puedes editar tu propio usuario desde aquí');
    return;
  }

  const modal = new Modal({ title: 'Editar Usuario', size: 'md' });

  const formHTML = `
    <form id="edit-user-form" class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Nombre completo *</label>
        <input type="text" name="name" class="form-control" required value="${user.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Rol *</label>
        <select name="role" class="form-control" required>
          <option value="RECEPTIONIST" ${user.role === 'RECEPTIONIST' ? 'selected' : ''}>Recepcionista</option>
          <option value="DOCTOR" ${user.role === 'DOCTOR' ? 'selected' : ''}>Médico</option>
          <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Especialidad</label>
        <input type="text" name="specialty" class="form-control" value="${user.specialty || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">No. de licencia</label>
        <input type="text" name="licenseNumber" class="form-control" value="${user.licenseNumber || ''}" />
      </div>
    </form>
  `;

  const isActive = user.active;
  const footerHTML = `
    <button type="button" class="btn ${isActive ? 'btn-warning' : 'btn-success'}" id="toggle-user-status">
      ${isActive ? 'Desactivar usuario' : 'Activar usuario'}
    </button>
    <button type="button" class="btn btn-secondary" id="cancel-edit-user">Cancelar</button>
    <button type="submit" form="edit-user-form" class="btn btn-primary" id="save-edit-user">Guardar cambios</button>
  `;

  modal.render(formHTML, footerHTML);

  document.getElementById('cancel-edit-user')?.addEventListener('click', () => modal.close());

  document.getElementById('toggle-user-status')?.addEventListener('click', async () => {
    try {
      await usersService.updateStatus(user.id, !isActive);
      Toast.success(`Usuario ${!isActive ? 'activado' : 'desactivado'} correctamente`);
      modal.close();
      loadUsers();
    } catch (err) {
      Toast.error(err.message || 'Error al cambiar el estado');
    }
  });

  document.getElementById('edit-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-edit-user');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    Object.keys(data).forEach((k) => { if (!data[k]) data[k] = null; });

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';
      await usersService.update(user.id, data);
      Toast.success('Usuario actualizado exitosamente');
      modal.close();
      loadUsers();
    } catch (err) {
      Toast.error(err.message || 'Error al actualizar el usuario');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar cambios';
    }
  });
}

export function render(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Gestión de Usuarios</h1>
      <p class="page-subtitle">Administra los usuarios del sistema</p>
    </div>
    <div class="card">
      <div id="users-table-container"></div>
    </div>
  `);

  const tableContainer = document.getElementById('users-table-container');

  tableInstance = new DataTable({
    container: tableContainer,
    columns,
    searchPlaceholder: 'Buscar usuarios...',
    onRowClick: handleRowClick,
    actions: `<button class="btn btn-primary" id="btn-new-user">+ Nuevo usuario</button>`,
  });

  tableInstance.render({ loading: true });
  loadUsers();

  tableContainer.addEventListener('click', (e) => {
    if (e.target.id === 'btn-new-user') renderCreateModal();
  });
}

export default { render };
