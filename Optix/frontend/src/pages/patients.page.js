// frontend/src/pages/patients.page.js
import patientsService from '../services/patients.service.js';
import DataTable from '../components/table.component.js';
import Modal from '../components/modal.component.js';
import Toast from '../components/toast.component.js';
import renderBadge from '../components/badge.component.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';

const columns = [
  {
    header: 'Paciente',
    key: 'name',
    render: (row) => `
      <div class="cell-patient">
        <div class="cell-avatar">${row.firstName[0]}${row.lastName[0]}</div>
        <div>
          <div class="fw-600">${row.firstName} ${row.lastName}</div>
          <div class="text-muted text-sm">${row.document}</div>
        </div>
      </div>
    `,
    csvValue: (row) => `${row.firstName} ${row.lastName}`,
  },
  { header: 'Documento', key: 'document', render: (row) => `<span class="text-muted text-sm">${row.documentType}: ${row.document}</span>`, csvValue: (row) => `${row.documentType}: ${row.document}` },
  { header: 'Teléfono', key: 'phoneNumber', render: (row) => row.phoneNumber || '—' },
  { header: 'Email', key: 'email', render: (row) => row.email || '—' },
  { header: 'Ciudad', key: 'city', render: (row) => row.city || '—' },
];

let currentPage = 1;
let currentSearch = '';
let tableInstance = null;

async function loadPatients(search = '', page = 1) {
  try {
    tableInstance?.showLoading();
    const result = await patientsService.list({ search, page, limit: 20 });
    tableInstance?.render({
      data: result.data,
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
    currentPage = result.page;
    currentSearch = search;
  } catch (err) {
    Toast.error('Error al cargar pacientes: ' + (err.message || 'Error desconocido'));
  }
}

function renderCreateModal() {
  const modal = new Modal({ title: 'Nuevo Paciente', size: 'lg' });

  const formHTML = `
    <form id="patient-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="firstName" class="form-control" required placeholder="Nombre del paciente" />
      </div>
      <div class="form-group">
        <label class="form-label">Apellidos *</label>
        <input type="text" name="lastName" class="form-control" required placeholder="Apellidos del paciente" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de documento *</label>
        <select name="documentType" class="form-control" required>
          <option value="">Seleccionar...</option>
          <option value="CC">Cédula de Ciudadanía</option>
          <option value="CE">Cédula de Extranjería</option>
          <option value="PA">Pasaporte</option>
          <option value="RC">Registro Civil</option>
          <option value="TI">Tarjeta de Identidad</option>
          <option value="NIT">NIT</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Número de documento *</label>
        <input type="text" name="document" class="form-control" required placeholder="Ej: 1234567890" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" placeholder="Ej: 3001234567" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" placeholder="correo@ejemplo.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de nacimiento</label>
        <input type="date" name="birthDate" class="form-control" />
      </div>
      <div class="form-group">
        <label class="form-label">Género</label>
        <select name="gender" class="form-control">
          <option value="">Seleccionar...</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="O">Otro</option>
        </select>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Dirección</label>
        <input type="text" name="address" class="form-control" placeholder="Dirección completa" />
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input type="text" name="city" class="form-control" placeholder="Ciudad de residencia" />
      </div>
      <div class="form-group">
        <label class="form-label">Barrio</label>
        <input type="text" name="neighborhood" class="form-control" placeholder="Barrio o localidad" />
      </div>
      <div class="form-group">
        <label class="form-label">Contacto de emergencia</label>
        <input type="text" name="emergencyName" class="form-control" placeholder="Nombre del contacto" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono de emergencia</label>
        <input type="tel" name="emergencyPhone" class="form-control" placeholder="Teléfono del contacto" />
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-patient">Cancelar</button>
    <button type="submit" form="patient-form" class="btn btn-primary" id="save-patient">
      Guardar paciente
    </button>
  `;

  modal.render(formHTML, footerHTML);

  document.getElementById('cancel-patient')?.addEventListener('click', () => modal.close());

  document.getElementById('patient-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-patient');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    // Limpiar campos vacíos
    Object.keys(data).forEach((k) => { if (!data[k]) delete data[k]; });

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';
      await patientsService.create(data);
      Toast.success('Paciente creado exitosamente');
      modal.close();
      loadPatients(currentSearch, currentPage);
    } catch (err) {
      Toast.error(err.message || 'Error al crear el paciente');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar paciente';
    }
  });
}

function renderEditModal(patient) {
  const modal = new Modal({ title: 'Editar Paciente', size: 'lg' });

  const formHTML = `
    <form id="edit-patient-form" class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="firstName" class="form-control" required value="${patient.firstName}" />
      </div>
      <div class="form-group">
        <label class="form-label">Apellidos *</label>
        <input type="text" name="lastName" class="form-control" required value="${patient.lastName}" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input type="tel" name="phoneNumber" class="form-control" value="${patient.phoneNumber || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" value="${patient.email || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input type="text" name="city" class="form-control" value="${patient.city || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Barrio</label>
        <input type="text" name="neighborhood" class="form-control" value="${patient.neighborhood || ''}" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Dirección</label>
        <input type="text" name="address" class="form-control" value="${patient.address || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Contacto de emergencia</label>
        <input type="text" name="emergencyName" class="form-control" value="${patient.emergencyName || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono de emergencia</label>
        <input type="tel" name="emergencyPhone" class="form-control" value="${patient.emergencyPhone || ''}" />
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-edit-patient">Cancelar</button>
    <button type="submit" form="edit-patient-form" class="btn btn-primary" id="save-edit-patient">
      Guardar cambios
    </button>
  `;

  modal.render(formHTML, footerHTML);

  document.getElementById('cancel-edit-patient')?.addEventListener('click', () => modal.close());

  document.getElementById('edit-patient-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-edit-patient');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    Object.keys(data).forEach((k) => { if (!data[k]) data[k] = null; });

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';
      await patientsService.update(patient.id, data);
      Toast.success('Paciente actualizado exitosamente');
      modal.close();
      loadPatients(currentSearch, currentPage);
    } catch (err) {
      Toast.error(err.message || 'Error al actualizar el paciente');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar cambios';
    }
  });
}

async function handleRowClick(id) {
  try {
    const patient = await patientsService.getById(id);
    renderPatientDetailModal(patient);
  } catch (err) {
    Toast.error('Error al cargar el paciente');
  }
}

function renderPatientDetailModal(patient) {
  const modal = new Modal({ title: `${patient.firstName} ${patient.lastName}`, size: 'lg' });

  const birthDate = patient.birthDate
    ? new Date(patient.birthDate).toLocaleDateString('es-CO')
    : 'No registrada';

  const recentAppointments = patient.appointments?.slice(0, 3).map((a) => `
    <div class="detail-list-item">
      <span>${new Date(a.dateTime).toLocaleDateString('es-CO')}</span>
      <span class="text-muted">${a.doctor?.name || '—'}</span>
    </div>
  `).join('') || '<p class="text-muted text-sm">Sin citas registradas</p>';

  const content = `
    <div class="patient-detail">
      <div class="patient-detail-hero">
        <div class="patient-avatar-lg">${patient.firstName[0]}${patient.lastName[0]}</div>
        <div>
          <h4>${patient.firstName} ${patient.lastName}</h4>
          <p class="text-muted">${patient.documentType}: ${patient.document}</p>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-section">
          <h5 class="detail-section-title">Información personal</h5>
          <div class="detail-field"><span>Teléfono</span><strong>${patient.phoneNumber || '—'}</strong></div>
          <div class="detail-field"><span>Email</span><strong>${patient.email || '—'}</strong></div>
          <div class="detail-field"><span>Fecha de nacimiento</span><strong>${birthDate}</strong></div>
          <div class="detail-field"><span>Género</span><strong>${patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : patient.gender || '—'}</strong></div>
          <div class="detail-field"><span>Ciudad</span><strong>${patient.city || '—'}</strong></div>
          <div class="detail-field"><span>Dirección</span><strong>${patient.address || '—'}</strong></div>
        </div>
        <div class="detail-section">
          <h5 class="detail-section-title">Últimas citas</h5>
          ${recentAppointments}
        </div>
      </div>
    </div>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="close-patient-detail">Cerrar</button>
    <button class="btn btn-primary" id="edit-patient-detail">Editar paciente</button>
  `;

  modal.render(content, footerHTML);

  document.getElementById('close-patient-detail')?.addEventListener('click', () => modal.close());
  document.getElementById('edit-patient-detail')?.addEventListener('click', () => {
    modal.close();
    setTimeout(() => renderEditModal(patient), 350);
  });
}

export function render(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Pacientes</h1>
      <p class="page-subtitle">Gestiona los registros de pacientes del consultorio</p>
    </div>
    <div class="card">
      <div id="patients-table-container"></div>
    </div>
  `);

  const tableContainer = document.getElementById('patients-table-container');

  tableInstance = new DataTable({
    container: tableContainer,
    columns,
    searchPlaceholder: 'Buscar por nombre, documento, teléfono...',
    onRowClick: handleRowClick,
    onSearch: (search) => loadPatients(search, 1),
    onPageChange: (page) => loadPatients(currentSearch, page),
    actions: `
      <button class="btn btn-primary" id="btn-new-patient">+ Nuevo paciente</button>
    `,
    exportable: true,
    exportFilename: 'pacientes',
  });

  tableInstance.render({ loading: true });
  loadPatients();

  // Necesitamos adjuntar el evento del botón después del render
  tableContainer.addEventListener('click', (e) => {
    if (e.target.id === 'btn-new-patient') renderCreateModal();
  });
}

export default { render };
