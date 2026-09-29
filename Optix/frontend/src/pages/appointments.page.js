// frontend/src/pages/appointments.page.js
import appointmentsService from '../services/appointments.service.js';
import patientsService from '../services/patients.service.js';
import usersService from '../services/users.service.js';
import Modal from '../components/modal.component.js';
import Toast from '../components/toast.component.js';
import renderBadge from '../components/badge.component.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';
import renderEmptyState from '../components/empty-state.component.js';
import router from '../utils/router.js';
import hxRecordsService from '../services/hx-records.service.js';
import authService from '../services/auth.service.js';

let currentDate = new Date();
let viewMode = 'week'; // day | week | month
let appointments = [];

function getWeekDates(date) {
  const week = [];
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d.setDate(d.getDate() - ((day + 6) % 7)));
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    week.push(day);
  }
  return week;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDay(date) {
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
}

function getStatusClass(status) {
  const map = {
    SCHEDULED: 'info', CONFIRMED: 'accent', WAITING: 'warning',
    IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger', NO_SHOW: 'neutral',
  };
  return map[status] || 'neutral';
}

function renderWeekView() {
  const week = getWeekDates(currentDate);
  const today = new Date().toDateString();

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am a 8pm

  const dayHeaders = week.map((d) => {
    const isToday = d.toDateString() === today;
    return `<div class="cal-day-header ${isToday ? 'today' : ''}">${formatDay(d)}</div>`;
  }).join('');

  const getApptInSlot = (day, hour) => {
    return appointments.filter((a) => {
      const d = new Date(a.dateTime);
      return d.toDateString() === day.toDateString() && d.getHours() === hour;
    });
  };

  const rows = hours.map((hour) => `
    <div class="cal-row">
      <div class="cal-hour-label">${String(hour).padStart(2, '0')}:00</div>
      ${week.map((day) => {
        const appts = getApptInSlot(day, hour);
        const isToday = day.toDateString() === today;
        return `
          <div class="cal-slot ${isToday ? 'today' : ''}" data-date="${day.toISOString()}" data-hour="${hour}">
            ${appts.map((a) => `
              <div class="cal-appt cal-appt-${getStatusClass(a.status)}" data-id="${a.id}">
                <div class="cal-appt-time">${formatTime(a.dateTime)}</div>
                <div class="cal-appt-name">${a.patient?.firstName} ${a.patient?.lastName}</div>
                <div class="cal-appt-doctor">${a.doctor?.name}</div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  return `
    <div class="calendar-wrapper">
      <div class="cal-header-row">
        <div class="cal-hour-label"></div>
        ${dayHeaders}
      </div>
      <div class="cal-body">${rows}</div>
    </div>
  `;
}

async function loadAppointments() {
  try {
    const week = getWeekDates(currentDate);
    const from = week[0].toISOString().split('T')[0];
    const to = week[6].toISOString().split('T')[0];

    // Cargar de toda la semana usando los límites de fecha
    const result = await appointmentsService.list({ limit: 100 });
    appointments = result.data || [];
    rerenderCalendar();
  } catch (err) {
    Toast.error('Error al cargar las citas');
  }
}

function rerenderCalendar() {
  const body = document.getElementById('calendar-body');
  if (body) {
    body.innerHTML = appointments.length > 0
      ? renderWeekView()
      : renderEmptyState({ icon: '📅', title: 'Sin citas esta semana', description: 'No hay citas programadas para esta semana' });
    attachCalendarEvents();
  }

  // Actualizar el título de la semana
  const week = getWeekDates(currentDate);
  const weekTitle = document.getElementById('cal-week-title');
  if (weekTitle) {
    const from = week[0].toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    const to = week[6].toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    weekTitle.textContent = `${from} — ${to}`;
  }
}

function attachCalendarEvents() {
  // Click en cita
  document.querySelectorAll('.cal-appt').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      try {
        const appt = await appointmentsService.getById(id);
        renderAppointmentDetailModal(appt);
      } catch (err) {
        Toast.error('Error al cargar la cita');
      }
    });
  });

  // Click en slot vacío para crear
  document.querySelectorAll('.cal-slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      const date = new Date(slot.dataset.date);
      date.setHours(parseInt(slot.dataset.hour), 0, 0, 0);
      renderCreateAppointmentModal(date);
    });
  });
}

function renderAppointmentDetailModal(appt) {
  const modal = new Modal({ title: 'Detalle de Cita', size: 'md' });

  const statusLabels = {
    SCHEDULED: 'Agendada', CONFIRMED: 'Confirmada', WAITING: 'En espera',
    IN_PROGRESS: 'En consulta', COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No asistió',
  };

  const content = `
    <div class="appt-detail">
      <div class="appt-detail-row">
        <span>Paciente</span>
        <strong>${appt.patient?.firstName} ${appt.patient?.lastName}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Médico</span>
        <strong>${appt.doctor?.name}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Fecha y hora</span>
        <strong>${new Date(appt.dateTime).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${formatTime(appt.dateTime)}</strong>
      </div>
      <div class="appt-detail-row">
        <span>Duración</span>
        <strong>${appt.duration} minutos</strong>
      </div>
      <div class="appt-detail-row">
        <span>Estado</span>
        <strong>${renderBadge(appt.status)}</strong>
      </div>
      ${appt.notes ? `<div class="appt-detail-row"><span>Notas</span><strong>${appt.notes}</strong></div>` : ''}
    </div>
    <div class="appt-status-actions" style="margin-top: 1.5rem;">
      <h4 class="text-sm text-muted mb-1">Cambiar estado:</h4>
      <div class="flex gap-sm flex-wrap">
        ${Object.entries(statusLabels).map(([key, label]) => `
          <button class="btn btn-sm ${appt.status === key ? 'btn-primary' : 'btn-secondary'} appt-status-btn" data-status="${key}" data-id="${appt.id}">
            ${label}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Solo médicos y admin acceden a historias clínicas
  const canUseHx = ['ADMIN', 'DOCTOR'].includes(authService.getLocalUser()?.role);
  const canStartHx = canUseHx && !['CANCELLED', 'NO_SHOW'].includes(appt.status);
  const hxButton = appt.hxRecord && canUseHx
    ? `<button class="btn btn-primary" id="open-appt-hx">Ver historia clínica</button>`
    : canStartHx ? `<button class="btn btn-primary" id="open-appt-hx">Iniciar historia clínica</button>` : '';
  const footerHTML = `<button class="btn btn-secondary" id="close-appt-detail">Cerrar</button>${hxButton}`;

  modal.render(content, footerHTML);
  document.getElementById('close-appt-detail')?.addEventListener('click', () => modal.close());

  document.getElementById('open-appt-hx')?.addEventListener('click', async (e) => {
    if (appt.hxRecord) {
      modal.close();
      router.navigate(`/hx-records/${appt.hxRecord.id}`);
      return;
    }

    e.target.disabled = true;
    try {
      // La historia se crea ya con los datos de la cita y se llena en su propia página
      const record = await hxRecordsService.create({
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
      });
      // Iniciar la historia pone la cita "En consulta"
      if (['SCHEDULED', 'CONFIRMED', 'WAITING'].includes(appt.status)) {
        await appointmentsService.updateStatus(appt.id, 'IN_PROGRESS');
      }
      modal.close();
      router.navigate(`/hx-records/${record.id}`);
    } catch (err) {
      Toast.error(err.error || err.message || 'Error al iniciar la historia clínica');
      e.target.disabled = false;
    }
  });

  document.querySelectorAll('.appt-status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await appointmentsService.updateStatus(btn.dataset.id, btn.dataset.status);
        Toast.success('Estado de la cita actualizado');
        modal.close();
        loadAppointments();
      } catch (err) {
        Toast.error(err.message || 'Error al actualizar el estado');
      }
    });
  });
}

async function renderCreateAppointmentModal(defaultDate) {
  const modal = new Modal({ title: 'Nueva Cita', size: 'md' });

  let patientsOpts = '<option value="">Cargando...</option>';
  let doctorsOpts = '<option value="">Cargando...</option>';

  const formHTML = `
    <form id="appt-form" class="form-grid-1">
      <div class="form-group">
        <label class="form-label">Paciente *</label>
        <select name="patientId" class="form-control" required id="appt-patient-select">
          ${patientsOpts}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Médico *</label>
        <select name="doctorId" class="form-control" required id="appt-doctor-select">
          ${doctorsOpts}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha y hora *</label>
        <input type="datetime-local" name="dateTime" class="form-control" required
          value="${defaultDate ? defaultDate.toISOString().slice(0, 16) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de cita</label>
        <select name="appointmentType" class="form-control">
          <option value="FIRST_VISIT">Primera visita</option>
          <option value="FOLLOW_UP">Seguimiento</option>
          <option value="URGENT">Urgente</option>
          <option value="PROCEDURE">Procedimiento</option>
          <option value="EXAM">Examen</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Duración (minutos)</label>
        <select name="duration" class="form-control">
          <option value="15">15 minutos</option>
          <option value="30" selected>30 minutos</option>
          <option value="45">45 minutos</option>
          <option value="60">1 hora</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea name="notes" class="form-control" rows="3" placeholder="Notas adicionales sobre la cita..."></textarea>
      </div>
    </form>
  `;

  const footerHTML = `
    <button type="button" class="btn btn-secondary" id="cancel-appt">Cancelar</button>
    <button type="submit" form="appt-form" class="btn btn-primary" id="save-appt">Agendar cita</button>
  `;

  modal.render(formHTML, footerHTML);

  // Cargar pacientes y médicos en paralelo
  try {
    const [patientsResult, usersResult] = await Promise.all([
      patientsService.list({ limit: 100 }),
      usersService.list(),
    ]);

    const patientSelect = document.getElementById('appt-patient-select');
    const doctorSelect = document.getElementById('appt-doctor-select');

    if (patientSelect) {
      patientSelect.innerHTML = '<option value="">Seleccionar paciente...</option>' +
        patientsResult.data.map((p) => `<option value="${p.id}">${p.firstName} ${p.lastName} - ${p.document}</option>`).join('');
    }

    if (doctorSelect) {
      const doctors = usersResult.filter((u) => u.role === 'DOCTOR');
      doctorSelect.innerHTML = '<option value="">Seleccionar médico...</option>' +
        doctors.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
    }
  } catch (err) {
    Toast.error('Error al cargar datos del formulario');
  }

  document.getElementById('cancel-appt')?.addEventListener('click', () => modal.close());

  document.getElementById('appt-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('save-appt');
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.duration = parseInt(data.duration);
    if (!data.notes) delete data.notes;

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Agendando...';
      await appointmentsService.create(data);
      Toast.success('Cita agendada exitosamente');
      modal.close();
      loadAppointments();
    } catch (err) {
      Toast.error(err.message || 'Error al agendar la cita');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Agendar cita';
    }
  });
}

export function render(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Agenda</h1>
      <p class="page-subtitle">Gestiona las citas del consultorio</p>
    </div>

    <div class="card">
      <div class="cal-controls">
        <div class="cal-nav">
          <button class="btn btn-secondary btn-sm" id="cal-prev">‹ Anterior</button>
          <span id="cal-week-title" class="cal-week-label"></span>
          <button class="btn btn-secondary btn-sm" id="cal-next">Siguiente ›</button>
        </div>
        <div class="cal-view-btns">
          <button class="btn btn-secondary btn-sm" id="cal-today">Hoy</button>
          <button class="btn btn-primary btn-sm" id="btn-new-appt">+ Nueva cita</button>
        </div>
      </div>
      <div id="calendar-body" style="overflow-x: auto; max-height: 70vh; overflow-y: auto;"></div>
    </div>
  `);

  // Eventos de navegación
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 7);
    loadAppointments();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 7);
    loadAppointments();
  });
  document.getElementById('cal-today')?.addEventListener('click', () => {
    currentDate = new Date();
    loadAppointments();
  });
  document.getElementById('btn-new-appt')?.addEventListener('click', () => {
    renderCreateAppointmentModal(new Date());
  });

  loadAppointments();
}

export default { render };
