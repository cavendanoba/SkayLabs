// frontend/src/pages/hx-records.page.js
import hxRecordsService from '../services/hx-records.service.js';
import patientsService from '../services/patients.service.js';
import appointmentsService from '../services/appointments.service.js';
import usersService from '../services/users.service.js';
import DataTable from '../components/table.component.js';
import Modal from '../components/modal.component.js';
import Toast from '../components/toast.component.js';
import renderBadge from '../components/badge.component.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';
import authService from '../services/auth.service.js';
import router from '../utils/router.js';

let tableInstance = null;
let currentPage = 1;
let currentSearch = '';

const AUTOSAVE_DELAY_MS = 800;

const APPT_TYPE_LABELS = {
  FIRST_VISIT: 'Primera visita', FOLLOW_UP: 'Seguimiento', URGENT: 'Urgente', PROCEDURE: 'Procedimiento', EXAM: 'Examen',
};

// Escapa texto del usuario antes de insertarlo en HTML (un " sin escapar corta el value del input)
const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const errorMessage = (err, fallback) => err?.error || err?.message || fallback;

const columns = [
  {
    header: 'Paciente',
    key: 'patient',
    render: (row) => {
      const p = row.patient;
      if (!p) return '—';
      return `
        <div class="cell-patient">
          <div class="cell-avatar">${esc(p.firstName[0])}${esc(p.lastName[0])}</div>
          <div>
            <div class="fw-600">${esc(p.firstName)} ${esc(p.lastName)}</div>
            <div class="text-muted text-sm">${esc(p.document)}</div>
          </div>
        </div>
      `;
    },
  },
  {
    header: 'Médico',
    key: 'doctor',
    render: (row) => esc(row.doctor?.name) || '—',
  },
  {
    header: 'Fecha',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
  },
  {
    header: 'Estado',
    key: 'status',
    render: (row) => renderBadge(row.status),
  },
  {
    header: 'Motivo',
    key: 'chiefComplaint',
    render: (row) => {
      const t = row.chiefComplaint || '—';
      return `<span title="${esc(t)}" class="text-truncate" style="max-width:200px;display:block">${esc(t.length > 40 ? t.slice(0, 40) + '...' : t)}</span>`;
    },
  },
];

async function loadRecords(search = '', page = 1) {
  try {
    tableInstance?.showLoading();
    const params = { page, limit: 20 };
    const result = await hxRecordsService.list(params);
    tableInstance?.render({ data: result.data, total: result.total, page: result.page, pages: result.pages });
    currentPage = result.page;
    currentSearch = search;
  } catch (err) {
    Toast.error('Error al cargar historias clínicas: ' + errorMessage(err, 'Error desconocido'));
  }
}

// ─── ACCORDION HELPER ────────────────────────────────────────────────────────
function accordion(id, title, content, open = false) {
  return `
    <div class="hx-accordion ${open ? 'open' : ''}" id="acc-${id}">
      <button class="hx-accordion-header" type="button" data-acc="${id}" aria-expanded="${open}">
        <span>${title}</span>
        <svg class="acc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>
      </button>
      <div class="hx-accordion-body">
        ${content}
      </div>
    </div>
  `;
}

function eyePairFields(label, name, values = {}) {
  return `
    <div class="hx-eye-pair">
      <div class="form-group">
        <label class="form-label">${label} — OD</label>
        <input type="text" name="${name}OD" class="form-control" placeholder="Ojo Derecho" value="${esc(values.od)}" />
      </div>
      <div class="form-group">
        <label class="form-label">${label} — OI</label>
        <input type="text" name="${name}OS" class="form-control" placeholder="Ojo Izquierdo" value="${esc(values.os)}" />
      </div>
    </div>
  `;
}

// La refracción se guarda como "Esf: -1.25 · Cil: -0.50 · Eje: 180"
function composeRefraction(sphere, cyl, axis) {
  return [sphere && `Esf: ${sphere}`, cyl && `Cil: ${cyl}`, axis && `Eje: ${axis}`].filter(Boolean).join(' · ');
}

function parseRefraction(value = '') {
  const part = (label) => value.match(new RegExp(`${label}:\\s*([^·]+)`))?.[1].trim() || '';
  return { sphere: part('Esf'), cyl: part('Cil'), axis: part('Eje') };
}

function diagnosisRow(i, d = {}) {
  return `
    <div class="hx-diag-row" data-idx="${i}">
      <input type="text" name="diag_code_${i}" class="form-control" placeholder="Código CIE-10 (ej: H52.1)" value="${esc(d.cie10Code)}" />
      <label class="hx-diag-primary-label">
        <input type="checkbox" name="diag_primary_${i}" ${d.isPrimary ? 'checked' : ''} /> Principal
      </label>
      <button type="button" class="btn btn-sm btn-danger hx-diag-remove hx-edit-only" data-idx="${i}">✕</button>
    </div>
  `;
}

function prescriptionRow(i, p = {}) {
  return `
    <div class="hx-presc-row" data-idx="${i}">
      <div class="form-group">
        <label class="form-label">Medicamento</label>
        <input type="text" name="presc_med_${i}" class="form-control" placeholder="Nombre del medicamento" value="${esc(p.medicationName)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Dosis</label>
        <input type="text" name="presc_dosage_${i}" class="form-control" placeholder="Ej: 1 gota" value="${esc(p.dosage)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Frecuencia</label>
        <input type="text" name="presc_freq_${i}" class="form-control" placeholder="Ej: 3 veces al día" value="${esc(p.frequency)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Duración</label>
        <input type="text" name="presc_dur_${i}" class="form-control" placeholder="Ej: 7 días" value="${esc(p.duration)}" />
      </div>
      <button type="button" class="btn btn-sm btn-danger hx-presc-remove hx-edit-only mt-2" data-idx="${i}">✕ Quitar</button>
    </div>
  `;
}

function renderHxForm(record, { readOnly = false } = {}) {
  const v = (field) => esc(record?.[field]);
  const ophth = record?.ophthalmology || {};
  const diagnoses = record?.diagnoses || [];
  const prescriptions = record?.prescriptions || [];
  const refOD = parseRefraction(ophth.refractionOD || '');
  const refOS = parseRefraction(ophth.refractionOS || '');

  const section1 = `
    <div class="form-grid-2">
      <div class="form-group form-group-full">
        <label class="form-label">Motivo de consulta</label>
        <textarea name="chiefComplaint" class="form-control" rows="3" placeholder="Descripción del motivo de consulta...">${v('chiefComplaint')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Antecedentes médicos</label>
        <textarea name="medicalHistory" class="form-control" rows="3" placeholder="Antecedentes sistémicos relevantes...">${v('medicalHistory')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Antecedentes quirúrgicos</label>
        <textarea name="surgicalHistory" class="form-control" rows="3" placeholder="Cirugías previas...">${v('surgicalHistory')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Alergias</label>
        <input type="text" name="allergies" class="form-control" placeholder="Alergias conocidas" value="${v('allergies')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Medicamentos actuales</label>
        <input type="text" name="medications" class="form-control" placeholder="Medicamentos en uso" value="${v('medications')}" />
      </div>
    </div>
  `;

  const section2 = `
    <div class="hx-eye-section">
      ${eyePairFields('Agudeza visual SC', 'visualAcuitySc', { od: ophth.visualAcuityScOD, os: ophth.visualAcuityScOS })}
      <div class="hx-eye-pair">
        <div class="form-group">
          <label class="form-label">Agudeza visual CC — OD</label>
          <input type="text" name="visualAcuityCCOD" class="form-control" placeholder="Con corrección OD" value="${esc(ophth.visualAcuityOD)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Agudeza visual CC — OI</label>
          <input type="text" name="visualAcuityCCOS" class="form-control" placeholder="Con corrección OI" value="${esc(ophth.visualAcuityOS)}" />
        </div>
      </div>
    </div>
  `;

  const section3 = `
    <div class="hx-eye-section">
      ${eyePairFields('Esfera', 'sphere', { od: refOD.sphere, os: refOS.sphere })}
      ${eyePairFields('Cilindro', 'cylinder', { od: refOD.cyl, os: refOS.cyl })}
      ${eyePairFields('Eje', 'axis', { od: refOD.axis, os: refOS.axis })}
      <div class="form-group form-group-full">
        <label class="form-label">Adición</label>
        <input type="text" name="addition" class="form-control" placeholder="Adición para lectura" value="${esc(ophth.addition)}" />
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Notas de refracción</label>
        <input type="text" name="refractionNotes" class="form-control" placeholder="Observaciones adicionales" value="${esc(ophth.refractionNotes)}" />
      </div>
    </div>
  `;

  const section4 = `
    <div class="hx-eye-pair">
      <div class="form-group">
        <label class="form-label">Tonometría — OD (mmHg)</label>
        <input type="number" name="iop_od" class="form-control" placeholder="Ej: 14" value="${esc(ophth.intraocularPressureOD)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tonometría — OI (mmHg)</label>
        <input type="number" name="iop_os" class="form-control" placeholder="Ej: 15" value="${esc(ophth.intraocularPressureOS)}" />
      </div>
    </div>
  `;

  const section5 = `
    <div class="hx-eye-section">
      <div class="form-group form-group-full">
        <label class="form-label">Biomicroscopía — OD</label>
        <textarea name="biomicroscopyOD" class="form-control" rows="3" placeholder="Hallazgos en segmento anterior OD...">${esc(ophth.biomicroscopyOD)}</textarea>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Biomicroscopía — OI</label>
        <textarea name="biomicroscopyOS" class="form-control" rows="3" placeholder="Hallazgos en segmento anterior OI...">${esc(ophth.biomicroscopyOS)}</textarea>
      </div>
    </div>
  `;

  const section6 = `
    <div class="hx-eye-section">
      <div class="form-group form-group-full">
        <label class="form-label">Fondo de ojo — OD</label>
        <textarea name="fundusOD" class="form-control" rows="3" placeholder="Hallazgos en segmento posterior OD...">${esc(ophth.fundusOD)}</textarea>
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">Fondo de ojo — OI</label>
        <textarea name="fundusOS" class="form-control" rows="3" placeholder="Hallazgos en segmento posterior OI...">${esc(ophth.fundusOS)}</textarea>
      </div>
    </div>
  `;

  const section7 = `
    <div id="hx-diagnoses-list">
      ${diagnoses.map((d, i) => diagnosisRow(i, d)).join('') || '<p class="text-muted text-sm mb-2">Sin diagnósticos agregados</p>'}
    </div>
    <button type="button" class="btn btn-secondary btn-sm hx-edit-only" id="btn-add-diagnosis">+ Agregar diagnóstico</button>
  `;

  const section8 = `
    <div class="form-group form-group-full">
      <label class="form-label">Plan de tratamiento</label>
      <textarea name="plan" class="form-control" rows="3" placeholder="Plan de manejo y recomendaciones...">${esc(ophth.plan)}</textarea>
    </div>
    <h5 class="mt-2 mb-1 text-sm fw-600">Prescripciones</h5>
    <div id="hx-presc-list">
      ${prescriptions.map((p, i) => prescriptionRow(i, p)).join('') || '<p class="text-muted text-sm mb-2">Sin prescripciones</p>'}
    </div>
    <button type="button" class="btn btn-secondary btn-sm hx-edit-only" id="btn-add-presc">+ Agregar prescripción</button>
  `;

  // En la página completa todas las secciones empiezan abiertas
  return `
    <form id="hx-form" class="${readOnly ? 'hx-readonly' : ''}" autocomplete="off">
      <fieldset class="hx-fieldset" ${readOnly ? 'disabled' : ''}>
        ${accordion('anamnesis', '1. Anamnesis y Antecedentes', section1, true)}
        ${accordion('av', '2. Agudeza Visual', section2, true)}
        ${accordion('refraction', '3. Refracción', section3, true)}
        ${accordion('tono', '4. Tonometría', section4, true)}
        ${accordion('biomicro', '5. Biomicroscopía', section5, true)}
        ${accordion('fondo', '6. Fondo de Ojo', section6, true)}
        ${accordion('dx', '7. Diagnóstico CIE-10', section7, true)}
        ${accordion('plan', '8. Plan y Prescripciones', section8, true)}
      </fieldset>
    </form>
  `;
}

function attachAccordionEvents() {
  document.querySelectorAll('[data-acc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.acc;
      const acc = document.getElementById(`acc-${id}`);
      const isOpen = acc.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
}

// Avisa al autoguardado de cambios que no disparan "input" (agregar/quitar filas)
function notifyFormChanged() {
  document.getElementById('hx-form')?.dispatchEvent(new Event('input', { bubbles: true }));
}

function attachRowEvents() {
  const nextIdx = (sel) => Math.max(-1, ...[...document.querySelectorAll(sel)].map((r) => Number(r.dataset.idx))) + 1;

  document.getElementById('btn-add-diagnosis')?.addEventListener('click', () => {
    const list = document.getElementById('hx-diagnoses-list');
    list.querySelector('p')?.remove();
    list.insertAdjacentHTML('beforeend', diagnosisRow(nextIdx('.hx-diag-row')));
    list.lastElementChild.querySelector('input')?.focus();
  });

  document.getElementById('btn-add-presc')?.addEventListener('click', () => {
    const list = document.getElementById('hx-presc-list');
    list.querySelector('p')?.remove();
    list.insertAdjacentHTML('beforeend', prescriptionRow(nextIdx('.hx-presc-row')));
    list.lastElementChild.querySelector('input')?.focus();
  });

  // Delegado: sirve también para filas agregadas después
  document.getElementById('hx-form')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.hx-diag-remove, .hx-presc-remove');
    if (!btn) return;
    btn.closest('.hx-diag-row, .hx-presc-row')?.remove();
    notifyFormChanged();
  });
}

// Envía siempre el estado completo del formulario: un campo vacío debe borrar lo guardado
function collectFormData(form) {
  const fd = new FormData(form);
  const get = (name) => fd.get(name)?.trim() || '';
  const num = (name) => (get(name) === '' ? null : Number(get(name)));

  const base = {};
  ['chiefComplaint', 'medicalHistory', 'surgicalHistory', 'allergies', 'medications'].forEach((k) => {
    base[k] = get(k);
  });

  const ophthalmology = {
    visualAcuityScOD: get('visualAcuityScOD'),
    visualAcuityScOS: get('visualAcuityScOS'),
    visualAcuityOD: get('visualAcuityCCOD'),
    visualAcuityOS: get('visualAcuityCCOS'),
    refractionOD: composeRefraction(get('sphereOD'), get('cylinderOD'), get('axisOD')),
    refractionOS: composeRefraction(get('sphereOS'), get('cylinderOS'), get('axisOS')),
    addition: get('addition'),
    refractionNotes: get('refractionNotes'),
    intraocularPressureOD: num('iop_od'),
    intraocularPressureOS: num('iop_os'),
    biomicroscopyOD: get('biomicroscopyOD'),
    biomicroscopyOS: get('biomicroscopyOS'),
    fundusOD: get('fundusOD'),
    fundusOS: get('fundusOS'),
    plan: get('plan'),
  };

  const diagnoses = [...form.querySelectorAll('.hx-diag-row')]
    .map((row) => {
      const i = row.dataset.idx;
      return { cie10Code: get(`diag_code_${i}`).toUpperCase(), isPrimary: fd.get(`diag_primary_${i}`) === 'on' };
    })
    .filter((d) => d.cie10Code);

  const prescriptions = [...form.querySelectorAll('.hx-presc-row')]
    .map((row) => {
      const i = row.dataset.idx;
      return {
        medicationName: get(`presc_med_${i}`),
        dosage: get(`presc_dosage_${i}`) || undefined,
        frequency: get(`presc_freq_${i}`) || undefined,
        duration: get(`presc_dur_${i}`) || undefined,
      };
    })
    .filter((p) => p.medicationName);

  return { ...base, ophthalmology, diagnoses, prescriptions };
}

// ─── AUTOGUARDADO ────────────────────────────────────────────────────────────
// Guarda con debounce, nunca dos peticiones a la vez y siempre el estado más reciente.
// El payload se toma al escribir, así un guardado pendiente se completa aunque el médico cambie de página.
function createAutosaver(recordId, onStatus) {
  let lastSavedJson = null;
  let pending = null;
  let failed = null;
  let timer = null;
  let loop = null;

  async function drain() {
    while (pending) {
      const payload = pending;
      pending = null;
      const json = JSON.stringify(payload);
      if (json === lastSavedJson) continue;

      onStatus('saving');
      try {
        await hxRecordsService.update(recordId, payload);
        lastSavedJson = json;
        failed = null;
      } catch (err) {
        failed = payload;
        if (!pending) {
          onStatus('error', errorMessage(err, 'Error al guardar'));
          return;
        }
      }
    }
    onStatus('saved');
  }

  function run() {
    clearTimeout(timer);
    timer = null;
    if (!loop) loop = drain().finally(() => { loop = null; });
    return loop;
  }

  return {
    setBaseline(payload) {
      lastSavedJson = JSON.stringify(payload);
    },
    queue(payload) {
      pending = payload;
      onStatus('dirty');
      clearTimeout(timer);
      timer = setTimeout(run, AUTOSAVE_DELAY_MS);
    },
    retry() {
      if (failed && !pending) pending = failed;
      return run();
    },
    // Guarda ya lo pendiente; devuelve false si quedó algo sin guardar
    async flush() {
      while (pending || loop) await run();
      return !failed;
    },
    hasUnsaved() {
      return Boolean(pending || loop || failed);
    },
  };
}

let activeSaver = null;

window.addEventListener('beforeunload', (e) => {
  if (activeSaver?.hasUnsaved()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function renderSaveStatus(state, message) {
  const el = document.getElementById('hx-save-status');
  if (!el) return;
  const time = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const states = {
    dirty: { text: 'Cambios sin guardar…', cls: 'is-dirty' },
    saving: { text: 'Guardando…', cls: 'is-saving' },
    saved: { text: `✓ Guardado ${time}`, cls: 'is-saved' },
    error: { text: `No se guardó: ${message}`, cls: 'is-error' },
  };
  const { text, cls } = states[state];
  el.className = `hx-save-status ${cls}`;
  el.textContent = text;
  el.title = state === 'error' ? 'Clic para reintentar' : '';
}

// ─── PÁGINA DE LA HISTORIA ───────────────────────────────────────────────────
export async function renderEditor(container, id) {
  renderAuthenticatedLayout(container, `<div id="hx-editor"><p class="text-muted">Cargando historia clínica…</p></div>`);

  let record;
  try {
    record = await hxRecordsService.getById(id);
  } catch (err) {
    document.getElementById('hx-editor').innerHTML = `
      <div class="card"><p>${esc(errorMessage(err, 'No se pudo cargar la historia clínica'))}</p>
      <a href="/hx-records" class="btn btn-secondary mt-2" data-hx-link>← Volver a historias clínicas</a></div>`;
    attachInternalLinks();
    return;
  }

  const readOnly = record.status !== 'DRAFT';
  const p = record.patient || {};
  const apptInfo = record.appointment
    ? `Cita: ${new Date(record.appointment.dateTime).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${record.appointment.appointmentType ? ` · ${APPT_TYPE_LABELS[record.appointment.appointmentType] || record.appointment.appointmentType}` : ''}`
    : 'Sin cita asociada';

  document.getElementById('hx-editor').innerHTML = `
    <a href="/hx-records" class="hx-back-link" data-hx-link>← Historias clínicas</a>
    <p class="page-subtitle">
      ${p.document ? `Doc. ${esc(p.document)} · ` : ''}${esc(record.doctor?.name)} · ${esc(apptInfo)}
    </p>
    <div class="hx-editor-bar">
      <h1 class="page-title">${esc(p.firstName)} ${esc(p.lastName)}</h1>
      <div class="hx-editor-actions">
        ${renderBadge(record.status)}
        ${readOnly
          ? `<span class="text-muted text-sm">Finalizada ${record.finalizedAt ? new Date(record.finalizedAt).toLocaleDateString('es-CO') : ''} · solo lectura</span>`
          : `<button type="button" id="hx-save-status" class="hx-save-status is-saved">✓ Todo guardado</button>
             <button class="btn btn-primary" id="hx-finalize">Finalizar historia</button>`}
      </div>
    </div>
    <div class="card hx-editor-card">
      ${renderHxForm(record, { readOnly })}
    </div>
  `;

  // La barra fija se ubica justo bajo el navbar, cuya altura cambia en móvil
  const navbar = document.querySelector('.app-navbar');
  if (navbar) document.documentElement.style.setProperty('--navbar-height', `${navbar.offsetHeight}px`);

  attachInternalLinks();
  attachAccordionEvents();
  if (readOnly) return;

  attachRowEvents();

  const form = document.getElementById('hx-form');
  const saver = createAutosaver(record.id, renderSaveStatus);
  saver.setBaseline(collectFormData(form));
  activeSaver = saver;

  const onChange = () => saver.queue(collectFormData(form));
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
  form.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('hx-save-status')?.addEventListener('click', () => saver.retry());
  document.getElementById('hx-finalize')?.addEventListener('click', () => confirmFinalize(record, saver));
}

function attachInternalLinks() {
  document.querySelectorAll('[data-hx-link]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(a.getAttribute('href'));
    });
  });
}

function confirmFinalize(record, saver) {
  const modal = new Modal({ title: 'Finalizar historia clínica', size: 'md' });
  modal.render(
    '<p>Una vez finalizada, la historia queda en solo lectura y no se podrá modificar.</p>',
    `<button class="btn btn-secondary" id="hx-finalize-cancel">Cancelar</button>
     <button class="btn btn-primary" id="hx-finalize-confirm">Finalizar</button>`,
  );
  document.getElementById('hx-finalize-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('hx-finalize-confirm')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    const saved = await saver.flush();
    if (!saved) {
      Toast.error('Hay cambios sin guardar. Corrige el error antes de finalizar.');
      modal.close();
      return;
    }
    try {
      await hxRecordsService.finalize(record.id);
      Toast.success('Historia clínica finalizada');
      modal.close();
      router.navigate(`/hx-records/${record.id}`);
    } catch (err) {
      Toast.error(errorMessage(err, 'Error al finalizar'));
      e.target.disabled = false;
    }
  });
}

// ─── NUEVA HISTORIA (sin cita previa) ────────────────────────────────────────
// El modal solo elige paciente/médico/cita; la historia se crea al instante y se llena en su página
async function renderCreateModal() {
  const modal = new Modal({ title: 'Nueva Historia Clínica', size: 'md' });

  modal.render(`
    <div class="form-grid-1">
      <div class="form-group">
        <label class="form-label">Paciente *</label>
        <select id="hx-patient-select" class="form-control" required><option value="">Cargando...</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">Cita asociada</label>
        <select id="hx-appt-select" class="form-control"><option value="">Selecciona un paciente</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">Médico *</label>
        <select id="hx-doctor-select" class="form-control" required><option value="">Cargando...</option></select>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" id="cancel-hx">Cancelar</button>
    <button class="btn btn-primary" id="start-hx">Comenzar historia</button>
  `);

  document.getElementById('cancel-hx')?.addEventListener('click', () => modal.close());

  try {
    const [pResult, uResult] = await Promise.all([
      patientsService.list({ limit: 100 }),
      usersService.list(),
    ]);
    const patSel = document.getElementById('hx-patient-select');
    const docSel = document.getElementById('hx-doctor-select');
    if (patSel) patSel.innerHTML = '<option value="">Seleccionar paciente...</option>' + pResult.data.map((p) => `<option value="${p.id}">${esc(p.firstName)} ${esc(p.lastName)} — ${esc(p.document)}</option>`).join('');
    if (docSel) {
      const doctors = uResult.filter((u) => u.role === 'DOCTOR');
      const currentUser = authService.getLocalUser();
      docSel.innerHTML = '<option value="">Seleccionar médico...</option>' + doctors.map((d) => `<option value="${d.id}" ${d.id === currentUser?.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
    }
  } catch (err) {
    Toast.error('Error al cargar datos');
  }

  async function loadAppointmentsForPatient(patientId) {
    const apptSel = document.getElementById('hx-appt-select');
    if (!apptSel) return;
    if (!patientId) {
      apptSel.innerHTML = '<option value="">Selecciona un paciente</option>';
      return;
    }
    apptSel.innerHTML = '<option value="">Cargando...</option>';
    try {
      const result = await appointmentsService.list({ patientId, status: 'CONFIRMED,SCHEDULED,WAITING,IN_PROGRESS', limit: 50 });
      const appts = (result.data || result).filter((a) => !a.hxRecord);
      apptSel.innerHTML = '<option value="">Sin cita asociada</option>' +
        appts.map((a) => {
          const dt = new Date(a.dateTime).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `<option value="${a.id}" data-doctor="${a.doctorId}">${dt} — ${APPT_TYPE_LABELS[a.appointmentType] || a.appointmentType}</option>`;
        }).join('');
    } catch {
      apptSel.innerHTML = '<option value="">Error al cargar citas</option>';
    }
  }

  document.getElementById('hx-patient-select')?.addEventListener('change', (e) => {
    loadAppointmentsForPatient(e.target.value);
  });

  // Al elegir una cita, el médico se toma de ella
  document.getElementById('hx-appt-select')?.addEventListener('change', (e) => {
    const doctorId = e.target.selectedOptions[0]?.dataset.doctor;
    const docSel = document.getElementById('hx-doctor-select');
    if (doctorId && docSel) docSel.value = doctorId;
  });

  document.getElementById('start-hx')?.addEventListener('click', async (e) => {
    const patientId = document.getElementById('hx-patient-select')?.value;
    const doctorId = document.getElementById('hx-doctor-select')?.value;
    const appointmentId = document.getElementById('hx-appt-select')?.value;

    if (!patientId || !doctorId) {
      Toast.warning('Selecciona paciente y médico');
      return;
    }

    e.target.disabled = true;
    try {
      const payload = { patientId, doctorId };
      if (appointmentId) payload.appointmentId = appointmentId;
      const record = await hxRecordsService.create(payload);
      modal.close();
      router.navigate(`/hx-records/${record.id}`);
    } catch (err) {
      Toast.error(errorMessage(err, 'Error al crear la historia'));
      e.target.disabled = false;
    }
  });
}

export function render(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Historia Clínica</h1>
      <p class="page-subtitle">Gestiona las historias clínicas oftalmológicas</p>
    </div>
    <div class="card">
      <div id="hx-table-container"></div>
    </div>
  `);

  const tableContainer = document.getElementById('hx-table-container');

  tableInstance = new DataTable({
    container: tableContainer,
    columns,
    searchPlaceholder: 'Buscar historia clínica...',
    onRowClick: (id) => router.navigate(`/hx-records/${id}`),
    onSearch: (search) => loadRecords(search, 1),
    onPageChange: (page) => loadRecords(currentSearch, page),
    actions: `<button class="btn btn-primary" id="btn-new-hx">+ Nueva historia</button>`,
  });

  tableInstance.render({ loading: true });
  loadRecords();

  tableContainer.addEventListener('click', (e) => {
    if (e.target.id === 'btn-new-hx') renderCreateModal();
  });
}

export default { render, renderEditor };
