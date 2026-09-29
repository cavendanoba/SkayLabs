// frontend/src/components/skeleton.component.js

export function renderSkeleton(count = 5, type = 'row') {
  if (type === 'card') {
    return Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `).join('');
  }

  if (type === 'kpi') {
    return Array.from({ length: count }, () => `
      <div class="skeleton-kpi">
        <div class="skeleton skeleton-kpi-value"></div>
        <div class="skeleton skeleton-kpi-label"></div>
      </div>
    `).join('');
  }

  // rows (tabla)
  return Array.from({ length: count }, () => `
    <tr class="skeleton-row">
      <td><div class="skeleton skeleton-cell"></div></td>
      <td><div class="skeleton skeleton-cell"></div></td>
      <td><div class="skeleton skeleton-cell short"></div></td>
      <td><div class="skeleton skeleton-cell short"></div></td>
    </tr>
  `).join('');
}

// CSS
if (!document.querySelector('#skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    .skeleton {
      background: linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-border) 50%, var(--color-surface-raised) 75%);
      background-size: 1000px 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .skeleton-title { height: 1.5rem; width: 60%; margin-bottom: 0.75rem; }
    .skeleton-text { height: 1rem; width: 100%; margin-bottom: 0.5rem; }
    .skeleton-text.short { width: 40%; }
    .skeleton-cell { height: 1rem; width: 80%; }
    .skeleton-cell.short { width: 40%; }
    .skeleton-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .skeleton-kpi {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .skeleton-kpi-value { height: 2.5rem; width: 50%; margin-bottom: 0.75rem; }
    .skeleton-kpi-label { height: 1rem; width: 70%; }
    .skeleton-row td { padding: 1rem; }
  `;
  document.head.appendChild(style);
}

export default renderSkeleton;
