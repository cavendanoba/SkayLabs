// frontend/src/components/empty-state.component.js

export function renderEmptyState({ icon = '📭', title = 'Sin resultados', description = 'No hay elementos para mostrar', action = null } = {}) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-description">${description}</p>
      ${action ? `<div class="empty-state-action">${action}</div>` : ''}
    </div>
  `;
}

// CSS
if (!document.querySelector('#empty-state-styles')) {
  const style = document.createElement('style');
  style.id = 'empty-state-styles';
  style.textContent = `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    .empty-state-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: var(--color-text);
    }
    .empty-state-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin: 0 0 1.5rem 0;
      max-width: 300px;
    }
  `;
  document.head.appendChild(style);
}

export default renderEmptyState;
