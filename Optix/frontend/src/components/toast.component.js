// frontend/src/components/toast.component.js

export class Toast {
  static show(message, type = 'info', duration = 3000) {
    const id = `toast-${Date.now()}`;
    const container = document.getElementById('toast-container') || this.createContainer();

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type} slide-in-up`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <div class="toast-content">
        <span>${message}</span>
        <button class="toast-close" aria-label="Cerrar">&times;</button>
      </div>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    if (duration) {
      setTimeout(() => {
        toast.remove();
      }, duration);
    }
  }

  static success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }

  static error(message, duration = 4000) {
    this.show(message, 'danger', duration);
  }

  static info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }

  static warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  static createContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }
}

// CSS para toasts
if (!document.querySelector('#toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: var(--z-toast);
      max-width: 400px;
    }

    .toast {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toast-success {
      border-left: 4px solid var(--color-success);
    }

    .toast-danger {
      border-left: 4px solid var(--color-danger);
    }

    .toast-warning {
      border-left: 4px solid var(--color-warning);
    }

    .toast-info {
      border-left: 4px solid var(--color-info);
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.5rem;
      color: var(--color-text-muted);
      transition: color var(--transition-base);
    }

    .toast-close:hover {
      color: var(--color-text);
    }

    @media (max-width: 768px) {
      #toast-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Toast;
