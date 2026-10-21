// frontend/src/pages/dashboard.page.js
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, BarElement, ArcElement, DoughnutController, LineController, BarController } from 'chart.js';
import renderAuthenticatedLayout from '../layouts/authenticated.layout.js';
import dashboardService from '../services/dashboard.service.js';
import renderBadge from '../components/badge.component.js';
import renderSkeleton from '../components/skeleton.component.js';
import Toast from '../components/toast.component.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, BarElement, ArcElement, DoughnutController, LineController, BarController);

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function animateCounter(el, target, suffix = '', isCurrency = false) {
  const duration = 900;
  const start = Date.now();

  function update() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    if (isCurrency) {
      el.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    } else {
      el.textContent = value.toLocaleString('es-CO') + suffix;
    }

    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderKpiCards(today, summary) {
  const cards = [
    {
      icon: '📅',
      id: 'kpi-citas',
      value: today.totalAppointments,
      label: 'Citas hoy',
      sub: `${today.completedAppointments} completadas · ${today.pendingAppointments} pendientes`,
      color: '--color-info',
      isCurrency: false,
      suffix: '',
    },
    {
      icon: '💰',
      id: 'kpi-ingresos',
      value: today.incomeToday,
      label: 'Ingresos hoy',
      sub: `${formatCurrency(summary?.incomeThisMonth || 0)} este mes`,
      color: '--color-success',
      isCurrency: true,
      suffix: '',
    },
    {
      icon: '👤',
      id: 'kpi-pacientes',
      value: summary?.totalPatients || 0,
      label: 'Pacientes totales',
      sub: `${today.newPatientsToday} nuevos hoy`,
      color: '--color-accent',
      isCurrency: false,
      suffix: '',
    },
    {
      icon: '📊',
      id: 'kpi-asistencia',
      value: today.attendanceRate,
      label: 'Tasa de asistencia',
      sub: `${today.cancelledAppointments} canceladas hoy`,
      color: '--color-warning',
      isCurrency: false,
      suffix: '%',
    },
  ];

  return `<div class="kpi-grid">
    ${cards.map((card, i) => `
      <div class="kpi-card" style="animation-delay: ${i * 0.08}s; animation: kpiFadeIn 0.5s ease forwards; opacity: 0;">
        <div class="kpi-icon" style="color: var(${card.color}); background: color-mix(in srgb, var(${card.color}) 12%, transparent);">
          ${card.icon}
        </div>
        <div class="kpi-info">
          <div class="kpi-value" id="${card.id}">0${card.suffix}</div>
          <div class="kpi-label">${card.label}</div>
          <div class="kpi-sub">${card.sub}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderTodayAppointments(appointments) {
  if (!appointments?.length) {
    return `<div class="empty-mini">
      <span style="font-size:2rem">📋</span>
      <p class="text-muted text-sm">No hay citas agendadas para hoy</p>
    </div>`;
  }

  const statusLabels = {
    SCHEDULED: 'Agendada', CONFIRMED: 'Confirmada', WAITING: 'En espera',
    IN_PROGRESS: 'En consulta', COMPLETED: 'Completada', CANCELLED: 'Cancelada', NO_SHOW: 'No asistió',
  };

  return appointments.slice(0, 7).map((a) => `
    <div class="upcoming-appt-item">
      <div class="upcoming-appt-time">${formatTime(a.dateTime)}</div>
      <div style="flex:1">
        <div class="fw-600 text-sm">${a.patient?.firstName} ${a.patient?.lastName}</div>
        <div class="text-muted text-xs">${a.doctor?.name}</div>
      </div>
      <div>${renderBadge(a.status)}</div>
    </div>
  `).join('');
}

function renderTopDiagnoses(diagnoses) {
  if (!diagnoses?.length) {
    return `<div class="empty-mini">
      <span style="font-size:2rem">🔍</span>
      <p class="text-muted text-sm">Sin diagnósticos registrados aún</p>
    </div>`;
  }

  const max = diagnoses[0]?.count || 1;
  return diagnoses.slice(0, 6).map((d, i) => `
    <div class="diag-rank-item">
      <div class="diag-rank-num">${i + 1}</div>
      <div style="flex:1; min-width:0;">
        <div class="fw-600 text-sm text-truncate" title="${d.description}">${d.description}</div>
        <div class="text-xs text-muted">${d.code}</div>
        <div class="diag-rank-bar mt-1">
          <div class="diag-rank-bar-fill" style="width: 0%" data-width="${Math.round((d.count / max) * 100)}"></div>
        </div>
      </div>
      <div class="text-sm fw-700 text-accent" style="min-width:32px;text-align:right">${d.count}</div>
    </div>
  `).join('');
}

function renderRecentActivity(appointments) {
  const recent = [...(appointments || [])]
    .filter(a => ['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status))
    .slice(0, 5);

  if (!recent.length) {
    return `<p class="text-muted text-sm text-center" style="padding:1rem">Sin actividad reciente</p>`;
  }

  const statusIcons = {
    COMPLETED: '✅',
    CANCELLED: '❌',
    NO_SHOW: '👻',
  };

  return recent.map((a) => `
    <div class="activity-item">
      <span class="activity-icon">${statusIcons[a.status] || '•'}</span>
      <div class="activity-body">
        <div class="text-sm fw-600">${a.patient?.firstName} ${a.patient?.lastName}</div>
        <div class="text-xs text-muted">${formatTime(a.dateTime)} — ${a.doctor?.name}</div>
      </div>
      ${renderBadge(a.status)}
    </div>
  `).join('');
}

let chartInstance = null;

function renderWeeklyChart(weekData) {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;

  // Destruir chart anterior si existe
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const accent = '#aec3d9';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';

  // Últimos 7 días
  const labels = [];
  const counts = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }));

    const match = weekData?.find(w => {
      const wDate = typeof w.date === 'string' ? w.date : new Date(w.date).toISOString().split('T')[0];
      return wDate === dateStr;
    });
    counts.push(match ? Number(match.count) : 0);
  }

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Citas',
        data: counts,
        borderColor: accent,
        backgroundColor: isDark
          ? 'rgba(174,195,217,0.12)'
          : 'rgba(43,67,98,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: accent,
        pointBorderColor: isDark ? '#111827' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a2535' : '#ffffff',
          titleColor: isDark ? '#f2f3f5' : '#0a0c18',
          bodyColor: isDark ? '#aec3d9' : '#2b4362',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} cita${ctx.parsed.y !== 1 ? 's' : ''}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, font: { family: 'Nunito', size: 11 } },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            font: { family: 'Nunito', size: 11 },
            stepSize: 1,
            precision: 0,
          },
          grid: { color: gridColor, drawBorder: false },
          border: { display: false },
        },
      },
    },
  });
}

export async function renderDashboardPage(container) {
  renderAuthenticatedLayout(container, `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle" id="dash-date"></p>
    </div>

    <div id="dashboard-kpis">
      <div class="kpi-grid">${renderSkeleton(4, 'kpi')}</div>
    </div>

    <div class="dash-main-grid">
      <!-- Gráfica semanal -->
      <div class="card dash-chart-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <h3 class="card-title" style="margin:0">Citas — últimos 7 días</h3>
          <span class="text-xs text-muted" id="chart-period"></span>
        </div>
        <div style="position:relative;height:220px">
          <canvas id="weekly-chart"></canvas>
        </div>
      </div>

      <!-- Citas de hoy -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <h3 class="card-title" style="margin:0">Citas de hoy</h3>
          <a href="/appointments" class="text-xs text-accent" data-route style="text-decoration:none">Ver todas →</a>
        </div>
        <div id="today-appointments">${renderSkeleton(3, 'card')}</div>
      </div>

      <!-- Top diagnósticos -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <h3 class="card-title" style="margin:0">Top diagnósticos CIE-10</h3>
          <a href="/hx-records" class="text-xs text-accent" data-route style="text-decoration:none">Ver historias →</a>
        </div>
        <div id="top-diagnoses">${renderSkeleton(3, 'card')}</div>
      </div>

      <!-- Actividad reciente -->
      <div class="card">
        <h3 class="card-title" style="margin-bottom:1.25rem">Actividad reciente</h3>
        <div id="recent-activity">${renderSkeleton(3, 'card')}</div>
      </div>
    </div>
  `);

  // Fecha actual
  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    // Capitalizar primera letra
    dateEl.textContent = dateEl.textContent.charAt(0).toUpperCase() + dateEl.textContent.slice(1);
  }

  // Ajustar estilos del chart según tema
  const chartPeriod = document.getElementById('chart-period');
  if (chartPeriod) {
    const endDate = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    const startDate = new Date(Date.now() - 6 * 86400000).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    chartPeriod.textContent = `${startDate} — ${endDate}`;
  }

  try {
    const [todayData, summaryData, topDiagnoses] = await Promise.all([
      dashboardService.getToday(),
      dashboardService.getSummary(),
      dashboardService.getTopDiagnoses(6),
    ]);

    // KPIs con animación
    document.getElementById('dashboard-kpis').innerHTML = renderKpiCards(todayData, summaryData);

    requestAnimationFrame(() => {
      animateCounter(document.getElementById('kpi-citas'), todayData.totalAppointments);
      animateCounter(document.getElementById('kpi-ingresos'), todayData.incomeToday, '', true);
      animateCounter(document.getElementById('kpi-pacientes'), summaryData?.totalPatients || 0);
      animateCounter(document.getElementById('kpi-asistencia'), todayData.attendanceRate, '%');
    });

    // Gráfica semanal
    renderWeeklyChart(summaryData?.appointmentsLastSevenDays || []);

    // Citas de hoy
    document.getElementById('today-appointments').innerHTML = renderTodayAppointments(todayData.appointments);

    // Top diagnósticos
    document.getElementById('top-diagnoses').innerHTML = renderTopDiagnoses(topDiagnoses);
    // Animar barras con pequeño delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.diag-rank-bar-fill').forEach((bar) => {
          bar.style.transition = 'width 0.9s cubic-bezier(0.4,0,0.2,1)';
          bar.style.width = bar.dataset.width + '%';
        });
      }, 200);
    });

    // Actividad reciente
    document.getElementById('recent-activity').innerHTML = renderRecentActivity(todayData.appointments);

    // Inicializar links con data-route
    document.querySelectorAll('[data-route]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        import('../utils/router.js').then(({ default: router }) => router.navigate(link.getAttribute('href')));
      });
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    Toast.error('Error al cargar el dashboard');
    document.getElementById('dashboard-kpis').innerHTML = '<p class="text-muted text-center" style="padding:2rem">Error al cargar los datos</p>';
  }
}

export default renderDashboardPage;
