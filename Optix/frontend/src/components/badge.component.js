// frontend/src/components/badge.component.js

const STATUS_COLORS = {
  // Appointment statuses
  SCHEDULED: 'info',
  CONFIRMED: 'accent',
  WAITING: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
  // Clinical record statuses
  DRAFT: 'warning',
  FINALIZED: 'success',
  // Generic
  active: 'success',
  inactive: 'neutral',
  INCOME: 'success',
  EXPENSE: 'danger',
  ADMIN: 'info',
  DOCTOR: 'accent',
  RECEPTIONIST: 'neutral',
  PATIENT: 'success',
};

const STATUS_LABELS = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  WAITING: 'En espera',
  IN_PROGRESS: 'En consulta',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  DRAFT: 'Borrador',
  FINALIZED: 'Finalizada',
  active: 'Activo',
  inactive: 'Inactivo',
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
  ADMIN: 'Admin',
  DOCTOR: 'Médico',
  RECEPTIONIST: 'Recepción',
  PATIENT: 'Paciente',
  FIRST_VISIT: 'Primera visita',
  FOLLOW_UP: 'Seguimiento',
  URGENT: 'Urgente',
  PROCEDURE: 'Procedimiento',
  EXAM: 'Examen',
};

export function renderBadge(status, customLabel = null) {
  const color = STATUS_COLORS[status] || 'neutral';
  const label = customLabel || STATUS_LABELS[status] || status;
  return `<span class="badge badge-${color}">${label}</span>`;
}

// CSS
if (!document.querySelector('#badge-styles')) {
  const style = document.createElement('style');
  style.id = 'badge-styles';
  style.textContent = `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .badge-success { background: rgba(76, 175, 130, 0.2); color: var(--color-success); border: 1px solid var(--color-success); }
    .badge-danger { background: rgba(224, 92, 92, 0.2); color: var(--color-danger); border: 1px solid var(--color-danger); }
    .badge-warning { background: rgba(232, 168, 56, 0.2); color: var(--color-warning); border: 1px solid var(--color-warning); }
    .badge-info { background: rgba(91, 155, 213, 0.2); color: var(--color-info); border: 1px solid var(--color-info); }
    .badge-accent { background: rgba(174, 195, 217, 0.2); color: var(--color-accent); border: 1px solid var(--color-accent); }
    .badge-neutral { background: rgba(205, 203, 199, 0.2); color: var(--color-warm-gray); border: 1px solid var(--color-warm-gray); }
  `;
  document.head.appendChild(style);
}

export default renderBadge;
