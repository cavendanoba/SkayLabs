// frontend/src/components/navbar.component.js
import themeUtil from '../utils/theme.js';
import authService from '../services/auth.service.js';
import router from '../utils/router.js';
import Toast from './toast.component.js';

function getLucideIcon(name) {
  const icons = {
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    chevronDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>',
    x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  };
  return icons[name] || '';
}

export function renderNavbar() {
  const user = authService.getLocalUser();
  const theme = themeUtil.get();
  const isDark = theme === 'dark';

  const logoHTML = `
    <a class="navbar-brand" href="/dashboard" data-route>
      <img src="/brand/svg/optix-icon.svg" class="nav-logo-icon" alt="Optix" aria-hidden="true" />
      <span class="nav-logo-text">OPTIX</span>
    </a>
  `;

  const desktopNav = `
    <nav class="nav-desktop">
      <div class="nav-dropdown">
        <button class="nav-link nav-dropdown-toggle">Clínica ${getLucideIcon('chevronDown')}</button>
        <div class="nav-dropdown-menu">
          <a href="/hx-records" class="nav-dropdown-item" data-route>Historia Clínica</a>
          <a href="/hx-records?tab=diagnoses" class="nav-dropdown-item" data-route>Diagnósticos CIE-10</a>
        </div>
      </div>
      <div class="nav-dropdown">
        <button class="nav-link nav-dropdown-toggle">Pacientes ${getLucideIcon('chevronDown')}</button>
        <div class="nav-dropdown-menu">
          <a href="/patients" class="nav-dropdown-item" data-route>Todos los pacientes</a>
          <a href="/patients?action=import" class="nav-dropdown-item" data-route>Importar pacientes</a>
        </div>
      </div>
      <a href="/appointments" class="nav-link" data-route>Agenda</a>
      <div class="nav-dropdown">
        <button class="nav-link nav-dropdown-toggle">Finanzas ${getLucideIcon('chevronDown')}</button>
        <div class="nav-dropdown-menu">
          <a href="/transactions" class="nav-dropdown-item" data-route>Caja / Transacciones</a>
          <a href="/transactions?tab=reports" class="nav-dropdown-item" data-route>Reportes</a>
        </div>
      </div>
    </nav>
  `;

  const navRight = `
    <div class="nav-right">
      <button class="nav-icon-btn" id="nav-theme-toggle" aria-label="Cambiar tema" title="${isDark ? 'Modo claro' : 'Modo oscuro'}">
        ${isDark ? getLucideIcon('sun') : getLucideIcon('moon')}
      </button>
      <button class="nav-icon-btn" id="nav-bell" aria-label="Notificaciones" title="Notificaciones">
        ${getLucideIcon('bell')}
        <span class="nav-bell-dot"></span>
      </button>
      <div class="nav-dropdown nav-avatar-dropdown">
        <button class="nav-avatar-btn nav-dropdown-toggle" aria-label="Menú de usuario">
          <div class="nav-avatar">${user?.name?.[0] || 'U'}</div>
          <div class="nav-user-info">
            <span class="nav-user-name">${user?.name || 'Usuario'}</span>
            <span class="nav-user-role">${getRoleLabel(user?.role)}</span>
          </div>
          ${getLucideIcon('chevronDown')}
        </button>
        <div class="nav-dropdown-menu nav-dropdown-right">
          <div class="nav-dropdown-header">${user?.email || ''}</div>
          <a href="#" class="nav-dropdown-item">${getLucideIcon('settings')} Configuración</a>
          ${user?.role === 'ADMIN' ? `<a href="/admin/users" class="nav-dropdown-item" data-route>${getLucideIcon('user')} Gestión de usuarios</a>` : ''}
          <hr class="nav-dropdown-divider" />
          <button class="nav-dropdown-item nav-dropdown-danger" id="nav-logout">${getLucideIcon('logout')} Cerrar sesión</button>
        </div>
      </div>
    </div>
  `;

  const mobileHeader = `
    <div class="nav-mobile-header">
      <button class="nav-icon-btn" id="nav-hamburger" aria-label="Menú">
        ${getLucideIcon('menu')}
      </button>
      <a class="navbar-brand" href="/dashboard" data-route>
        <img src="/brand/svg/optix-icon.svg" class="nav-logo-icon" alt="Optix" aria-hidden="true" />
        <span class="nav-logo-text">OPTIX</span>
      </a>
      <button class="nav-icon-btn" id="nav-theme-toggle-mobile" aria-label="Cambiar tema">
        ${isDark ? getLucideIcon('sun') : getLucideIcon('moon')}
      </button>
    </div>
  `;

  const offcanvas = `
    <div class="nav-offcanvas" id="nav-offcanvas" role="dialog" aria-label="Menú de navegación">
      <div class="nav-offcanvas-header">
        <div class="d-flex align-items-center gap-2">
          <img src="/brand/svg/optix-icon.svg" class="nav-logo-icon" alt="Optix" aria-hidden="true" />
          <span class="nav-logo-text">OPTIX</span>
        </div>
        <button class="nav-icon-btn" id="nav-offcanvas-close" aria-label="Cerrar menú">${getLucideIcon('x')}</button>
      </div>
      <div class="nav-offcanvas-body">
        <div class="nav-offcanvas-user">
          <div class="nav-avatar lg">${user?.name?.[0] || 'U'}</div>
          <div>
            <div class="nav-user-name">${user?.name || 'Usuario'}</div>
            <div class="nav-user-role">${getRoleLabel(user?.role)}</div>
          </div>
        </div>
        <nav class="nav-offcanvas-nav">
          <div class="nav-offcanvas-group">
            <button class="nav-offcanvas-group-toggle">Clínica</button>
            <div class="nav-offcanvas-group-items">
              <a href="/hx-records" class="nav-offcanvas-link" data-route>Historia Clínica</a>
              <a href="/hx-records?tab=diagnoses" class="nav-offcanvas-link" data-route>Diagnósticos CIE-10</a>
            </div>
          </div>
          <div class="nav-offcanvas-group">
            <button class="nav-offcanvas-group-toggle">Pacientes</button>
            <div class="nav-offcanvas-group-items">
              <a href="/patients" class="nav-offcanvas-link" data-route>Todos los pacientes</a>
              <a href="/patients?action=import" class="nav-offcanvas-link" data-route>Importar pacientes</a>
            </div>
          </div>
          <a href="/appointments" class="nav-offcanvas-link-root" data-route>Agenda</a>
          <div class="nav-offcanvas-group">
            <button class="nav-offcanvas-group-toggle">Finanzas</button>
            <div class="nav-offcanvas-group-items">
              <a href="/transactions" class="nav-offcanvas-link" data-route>Caja / Transacciones</a>
              <a href="/transactions?tab=reports" class="nav-offcanvas-link" data-route>Reportes</a>
            </div>
          </div>
          ${user?.role === 'ADMIN' ? `<a href="/admin/users" class="nav-offcanvas-link-root" data-route>Gestión de usuarios</a>` : ''}
        </nav>
        <div class="nav-offcanvas-footer">
          <button class="btn btn-secondary btn-full" id="nav-logout-mobile">
            ${getLucideIcon('logout')} Cerrar sesión
          </button>
        </div>
      </div>
    </div>
    <div class="nav-offcanvas-backdrop" id="nav-offcanvas-backdrop"></div>
  `;

  const notifPanel = `
    <div class="notif-panel" id="notif-panel" role="dialog" aria-label="Notificaciones">
      <div class="notif-panel-header">
        <h3 style="font-size:var(--font-size-base);font-weight:700;margin:0">Notificaciones</h3>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button class="notif-mark-all btn btn-sm btn-secondary" id="notif-mark-all">Marcar todo leído</button>
          <button class="nav-icon-btn" id="notif-close" aria-label="Cerrar notificaciones">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="notif-filters">
        <button class="notif-filter-btn active" data-filter="all">Todas</button>
        <button class="notif-filter-btn" data-filter="appointment">Citas</button>
        <button class="notif-filter-btn" data-filter="patient">Pacientes</button>
        <button class="notif-filter-btn" data-filter="system">Sistema</button>
      </div>
      <div class="notif-panel-body" id="notif-body">
        <div class="notif-loading">Cargando...</div>
      </div>
    </div>
    <div class="notif-overlay" id="notif-overlay"></div>
  `;

  return `
    <header class="app-navbar" id="app-navbar">
      ${mobileHeader}
      <div class="nav-desktop-layout">
        ${logoHTML}
        ${desktopNav}
        ${navRight}
      </div>
    </header>
    ${offcanvas}
    ${notifPanel}
  `;
}

function getRoleLabel(role) {
  const labels = { ADMIN: 'Administrador', DOCTOR: 'Médico', RECEPTIONIST: 'Recepcionista', PATIENT: 'Paciente' };
  return labels[role] || role || '';
}

export function initNavbarEvents() {
  // Theme toggle
  ['nav-theme-toggle', 'nav-theme-toggle-mobile'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        themeUtil.toggle();
        // Refresh navbar
        const navbar = document.getElementById('app-navbar');
        if (navbar) {
          const isDark = themeUtil.isDark();
          ['nav-theme-toggle', 'nav-theme-toggle-mobile'].forEach((bid) => {
            const b = document.getElementById(bid);
            if (b) b.innerHTML = isDark ? getLucideIcon('sun') : getLucideIcon('moon');
          });
        }
      });
    }
  });

  // Dropdowns
  document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = toggle.closest('.nav-dropdown');
      const wasOpen = dropdown.classList.contains('open');
      // Cerrar todos los dropdowns
      document.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
      if (!wasOpen) dropdown.classList.add('open');
    });
  });

  // Cerrar dropdowns al click fuera
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach((d) => d.classList.remove('open'));
  });

  // Logout
  ['nav-logout', 'nav-logout-mobile'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', async () => {
        await authService.logout();
        Toast.info('Sesión cerrada correctamente');
        setTimeout(() => router.navigate('/login'), 400);
      });
    }
  });

  // Offcanvas
  const hamburger = document.getElementById('nav-hamburger');
  const offcanvas = document.getElementById('nav-offcanvas');
  const backdrop = document.getElementById('nav-offcanvas-backdrop');
  const closeBtn = document.getElementById('nav-offcanvas-close');

  function openOffcanvas() {
    offcanvas?.classList.add('open');
    backdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOffcanvas() {
    offcanvas?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openOffcanvas);
  closeBtn?.addEventListener('click', closeOffcanvas);
  backdrop?.addEventListener('click', closeOffcanvas);

  // Offcanvas grupos acordeón
  document.querySelectorAll('.nav-offcanvas-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.parentElement;
      group.classList.toggle('open');
    });
  });

  // Navegación SPA para links con data-route
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeOffcanvas();
      router.navigate(link.getAttribute('href'));
    });
  });

  // ─── PANEL DE NOTIFICACIONES ──────────────────────────────────────────────
  const notifPanel = document.getElementById('notif-panel');
  const notifOverlay = document.getElementById('notif-overlay');
  const bellBtn = document.getElementById('nav-bell');
  const notifDot = bellBtn?.querySelector('.nav-bell-dot');

  // Datos de notificaciones en memoria (en producción vendría de API)
  const NOTIF_STORE_KEY = 'optix-notifications';

  function getNotifications() {
    try {
      const stored = localStorage.getItem(NOTIF_STORE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }

    // Generar notificaciones demo la primera vez
    const now = Date.now();
    const demo = [
      { id: 'n1', type: 'appointment', title: 'Cita confirmada', body: 'Carlos Mendoza confirmó su cita para las 10:00 AM', time: now - 1000 * 60 * 5, read: false },
      { id: 'n2', type: 'appointment', title: 'Cita cancelada', body: 'Ana López canceló su cita de mañana a las 2:00 PM', time: now - 1000 * 60 * 30, read: false },
      { id: 'n3', type: 'patient', title: 'Nuevo paciente registrado', body: 'Pedro Ramírez fue registrado como nuevo paciente', time: now - 1000 * 60 * 90, read: true },
      { id: 'n4', type: 'system', title: 'Respaldo completado', body: 'El respaldo automático de datos se completó exitosamente', time: now - 1000 * 3600 * 3, read: true },
      { id: 'n5', type: 'appointment', title: 'Recordatorio: citas de hoy', body: 'Tienes 5 citas programadas para hoy. La primera a las 8:00 AM', time: now - 1000 * 3600 * 8, read: false },
      { id: 'n6', type: 'patient', title: 'Historia clínica finalizada', body: 'La historia de María García fue finalizada por el Dr. Rodríguez', time: now - 1000 * 3600 * 24, read: true },
      { id: 'n7', type: 'system', title: 'Actualización disponible', body: 'Hay una nueva versión de Optix disponible con mejoras de rendimiento', time: now - 1000 * 3600 * 48, read: true },
    ];
    localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(demo));
    return demo;
  }

  function saveNotifications(notifs) {
    localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(notifs));
  }

  function updateBellDot() {
    const notifs = getNotifications();
    const unread = notifs.filter((n) => !n.read).length;
    if (notifDot) {
      notifDot.style.display = unread > 0 ? 'block' : 'none';
      notifDot.textContent = unread > 9 ? '9+' : (unread || '');
    }
  }

  function formatNotifTime(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Ahora';
    if (m < 60) return `Hace ${m} min`;
    if (h < 24) return `Hace ${h}h`;
    if (d === 1) return 'Ayer';
    return `Hace ${d} días`;
  }

  const TYPE_ICONS = {
    appointment: '📅',
    patient: '👤',
    system: '⚙️',
  };

  function renderNotifList(filter = 'all') {
    const notifs = getNotifications();
    const body = document.getElementById('notif-body');
    if (!body) return;

    const filtered = filter === 'all' ? notifs : notifs.filter((n) => n.type === filter);

    if (!filtered.length) {
      body.innerHTML = `<div class="notif-empty">
        <span style="font-size:2rem">🔔</span>
        <p class="text-muted text-sm">No hay notificaciones</p>
      </div>`;
      return;
    }

    // Agrupar por período
    const now = Date.now();
    const groups = { today: [], week: [], older: [] };
    filtered.forEach((n) => {
      const diff = now - n.time;
      if (diff < 86400000) groups.today.push(n);
      else if (diff < 604800000) groups.week.push(n);
      else groups.older.push(n);
    });

    const renderGroup = (label, items) => {
      if (!items.length) return '';
      return `
        <div class="notif-group-label">${label}</div>
        ${items.map((n) => `
          <div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}" role="button" tabindex="0">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem">
              <div style="display:flex;gap:0.5rem;flex:1">
                <span>${TYPE_ICONS[n.type] || '•'}</span>
                <div style="flex:1">
                  <div class="fw-600 text-sm" style="margin-bottom:0.15rem">${n.title}</div>
                  <div class="text-muted text-xs" style="line-height:1.4">${n.body}</div>
                </div>
              </div>
              <span class="text-xs text-muted" style="white-space:nowrap;flex-shrink:0">${formatNotifTime(n.time)}</span>
            </div>
          </div>
        `).join('')}
      `;
    };

    body.innerHTML =
      renderGroup('Hoy', groups.today) +
      renderGroup('Esta semana', groups.week) +
      renderGroup('Anteriores', groups.older);

    // Marcar como leída al hacer click
    body.querySelectorAll('.notif-item').forEach((item) => {
      item.addEventListener('click', () => {
        const notifs = getNotifications();
        const id = item.dataset.notifId;
        const n = notifs.find((x) => x.id === id);
        if (n && !n.read) {
          n.read = true;
          saveNotifications(notifs);
          item.classList.remove('unread');
          updateBellDot();
        }
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') item.click();
      });
    });
  }

  function openNotifPanel() {
    notifPanel?.classList.add('open');
    notifOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderNotifList('all');
    // Resetear filtro activo
    document.querySelectorAll('.notif-filter-btn').forEach((b) => b.classList.remove('active'));
    document.querySelector('.notif-filter-btn[data-filter="all"]')?.classList.add('active');
  }

  function closeNotifPanel() {
    notifPanel?.classList.remove('open');
    notifOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openNotifPanel();
  });

  document.getElementById('notif-close')?.addEventListener('click', closeNotifPanel);
  notifOverlay?.addEventListener('click', closeNotifPanel);

  document.getElementById('notif-mark-all')?.addEventListener('click', () => {
    const notifs = getNotifications();
    notifs.forEach((n) => { n.read = true; });
    saveNotifications(notifs);
    updateBellDot();
    renderNotifList(document.querySelector('.notif-filter-btn.active')?.dataset.filter || 'all');
  });

  // Filtros
  document.querySelectorAll('.notif-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.notif-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderNotifList(btn.dataset.filter);
    });
  });

  // Inicializar dot de campana
  updateBellDot();

  // Escape cierra el panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNotifPanel();
      closeOffcanvas();
    }
  });
}

// CSS del Navbar
if (!document.querySelector('#navbar-styles')) {
  const style = document.createElement('style');
  style.id = 'navbar-styles';
  style.textContent = `
    /* === NAVBAR BASE === */
    .app-navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-navbar);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(10px);
    }
    .nav-desktop-layout {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 0 2rem;
      height: 64px;
    }
    .nav-mobile-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      height: 56px;
    }
    @media (max-width: 1024px) {
      .nav-desktop-layout { display: none; }
      .nav-mobile-header { display: flex; }
    }

    /* === LOGO === */
    .navbar-brand { text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
    .nav-logo-icon {
      height: 32px;
      width: 32px;
      border-radius: 8px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .nav-logo-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 3px;
      color: var(--color-accent);
    }

    /* === DESKTOP NAV === */
    .nav-desktop { display: flex; align-items: center; gap: 0.25rem; flex: 1; }
    .nav-link {
      background: none;
      border: none;
      color: var(--color-text-muted);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .nav-link:hover { color: var(--color-text); background: var(--color-surface-raised); }
    .nav-link.active { color: var(--color-accent); }

    /* === DROPDOWNS === */
    .nav-dropdown { position: relative; }
    .nav-dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      left: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      min-width: 220px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      display: none;
      z-index: 100;
      animation: slideInDown 0.2s ease;
    }
    .nav-dropdown-right { left: auto; right: 0; }
    .nav-dropdown.open .nav-dropdown-menu { display: block; }
    .nav-dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1rem;
      color: var(--color-text);
      text-decoration: none;
      font-size: var(--font-size-sm);
      transition: background 0.2s;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
      font-family: var(--font-family);
    }
    .nav-dropdown-item:first-child { border-radius: 12px 12px 0 0; }
    .nav-dropdown-item:last-child { border-radius: 0 0 12px 12px; }
    .nav-dropdown-item:hover { background: var(--color-surface-raised); }
    .nav-dropdown-header {
      padding: 0.75rem 1rem 0.5rem;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
    }
    .nav-dropdown-divider { border: none; border-top: 1px solid var(--color-border); margin: 0.25rem 0; }
    .nav-dropdown-danger { color: var(--color-danger) !important; }
    .nav-dropdown-danger:hover { background: rgba(224,92,92,0.1) !important; }

    /* === RIGHT SIDE === */
    .nav-right { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }
    .nav-icon-btn {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      position: relative;
    }
    .nav-icon-btn:hover { color: var(--color-text); background: var(--color-surface-raised); }
    .nav-bell-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 8px; height: 8px;
      background: var(--color-danger);
      border-radius: 50%;
      border: 2px solid var(--color-surface);
    }

    /* === AVATAR === */
    .nav-avatar-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      color: var(--color-text);
      font-family: var(--font-family);
      transition: all 0.2s;
    }
    .nav-avatar-btn:hover { border-color: var(--color-accent); background: var(--color-accent-glow); }
    .nav-avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, var(--color-navy), var(--color-steel));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      color: white;
    }
    .nav-avatar.lg { width: 48px; height: 48px; font-size: 1.25rem; border-radius: 12px; }
    .nav-user-info { display: flex; flex-direction: column; align-items: flex-start; }
    .nav-user-name { font-size: var(--font-size-sm); font-weight: 600; }
    .nav-user-role { font-size: var(--font-size-xs); color: var(--color-text-muted); }

    /* === OFFCANVAS === */
    .nav-offcanvas {
      position: fixed;
      top: 0; left: 0;
      width: 280px;
      height: 100vh;
      background: var(--color-surface);
      z-index: 1060;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .nav-offcanvas.open { transform: translateX(0); }
    .nav-offcanvas-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 1059;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .nav-offcanvas-backdrop.open { opacity: 1; pointer-events: all; }
    .nav-offcanvas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--color-border);
    }
    .nav-offcanvas-body { flex: 1; overflow-y: auto; padding: 1rem; }
    .nav-offcanvas-user {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-surface-raised);
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .nav-offcanvas-nav { display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-offcanvas-link-root {
      display: block;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: var(--color-text);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: 500;
      transition: background 0.2s;
    }
    .nav-offcanvas-link-root:hover { background: var(--color-surface-raised); color: var(--color-accent); }
    .nav-offcanvas-group-toggle {
      width: 100%;
      background: none;
      border: none;
      color: var(--color-text);
      font-family: var(--font-family);
      font-size: var(--font-size-sm);
      font-weight: 600;
      padding: 0.75rem 1rem;
      text-align: left;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .nav-offcanvas-group-toggle:hover { background: var(--color-surface-raised); }
    .nav-offcanvas-group-items { display: none; padding-left: 1rem; }
    .nav-offcanvas-group.open .nav-offcanvas-group-items { display: block; }
    .nav-offcanvas-link {
      display: block;
      padding: 0.6rem 1rem;
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: var(--font-size-sm);
      border-radius: 8px;
      transition: all 0.2s;
    }
    .nav-offcanvas-link:hover { color: var(--color-accent); background: var(--color-surface-raised); }
    .nav-offcanvas-footer {
      padding: 1rem;
      border-top: 1px solid var(--color-border);
      margin-top: auto;
    }

    /* === NOTIFICATION PANEL === */
    .notif-panel {
      position: fixed;
      top: 0; right: -380px;
      width: 360px;
      height: 100vh;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      box-shadow: -4px 0 32px rgba(0,0,0,0.25);
      z-index: 1070;
      transition: right 0.3s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      flex-direction: column;
    }
    .notif-panel.open { right: 0; }
    .notif-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 1069;
      opacity: 0; pointer-events: none;
      transition: opacity 0.3s;
    }
    .notif-overlay.open { opacity: 1; pointer-events: all; }
    .notif-panel-header {
      padding: 1.25rem 1.25rem 0.75rem;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .notif-filters {
      display: flex;
      gap: 0.35rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .notif-filter-btn {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      color: var(--color-text-muted);
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .notif-filter-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
    .notif-filter-btn.active { background: var(--color-accent); color: var(--color-midnight); border-color: var(--color-accent); }
    .notif-panel-body { flex: 1; overflow-y: auto; padding: 0.75rem 1rem; }
    .notif-group-label {
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-muted);
      margin: 1rem 0 0.5rem;
      padding: 0 0.25rem;
    }
    .notif-item {
      padding: 0.85rem;
      border-radius: 10px;
      background: var(--color-surface-raised);
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: background 0.15s;
      font-size: var(--font-size-sm);
      border: 1px solid transparent;
    }
    .notif-item:hover { background: var(--color-accent-glow); border-color: var(--color-border); }
    .notif-item.unread { border-left: 3px solid var(--color-accent); background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-raised)); }
    .notif-empty {
      text-align: center;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .notif-loading { text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: var(--font-size-sm); }
    .nav-bell-dot {
      position: absolute;
      top: 4px; right: 4px;
      min-width: 16px; height: 16px;
      background: var(--color-danger);
      border-radius: 10px;
      border: 2px solid var(--color-surface);
      font-size: 9px;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }
    @media (max-width: 480px) {
      .notif-panel { width: 100vw; right: -100vw; }
    }
  `;
  document.head.appendChild(style);
}

export default { renderNavbar, initNavbarEvents };
