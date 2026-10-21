// frontend/src/components/modal.component.js

export class Modal {
  constructor({ id, title, size = 'md', onClose } = {}) {
    this.id = id || `modal-${Date.now()}`;
    this.title = title;
    this.size = size;
    this.onClose = onClose;
    this._el = null;
  }

  render(content, footer = '') {
    const existing = document.getElementById(this.id);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = this.id;
    modal.className = 'optix-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', this.title);
    modal.innerHTML = `
      <div class="optix-modal optix-modal-${this.size}">
        <div class="optix-modal-header">
          <h3 class="optix-modal-title">${this.title}</h3>
          <button class="optix-modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="optix-modal-body">${content}</div>
        ${footer ? `<div class="optix-modal-footer">${footer}</div>` : ''}
      </div>
    `;

    document.body.appendChild(modal);
    this._el = modal;

    // Animación de entrada
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });

    // Cerrar al hacer click en el backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Cerrar con botón
    modal.querySelector('.optix-modal-close').addEventListener('click', () => this.close());

    // Cerrar con Escape
    this._keyHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._keyHandler);

    return modal;
  }

  close() {
    if (!this._el) return;
    this._el.classList.remove('active');
    setTimeout(() => {
      this._el?.remove();
      this._el = null;
      if (this.onClose) this.onClose();
    }, 300);
    document.removeEventListener('keydown', this._keyHandler);
  }

  static close(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  getElement() {
    return this._el;
  }
}

// Inyectar CSS
if (!document.querySelector('#modal-styles')) {
  const style = document.createElement('style');
  style.id = 'modal-styles';
  style.textContent = `
    .optix-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .optix-modal-backdrop.active {
      opacity: 1;
    }
    .optix-modal {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform 0.3s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .optix-modal-backdrop.active .optix-modal {
      transform: scale(1);
    }
    .optix-modal-sm { max-width: 400px; }
    .optix-modal-md { max-width: 600px; }
    .optix-modal-lg { max-width: 800px; }
    .optix-modal-xl { max-width: 1000px; }
    .optix-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .optix-modal-title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      margin: 0;
    }
    .optix-modal-close {
      background: none;
      border: none;
      font-size: 1.75rem;
      cursor: pointer;
      color: var(--color-text-muted);
      line-height: 1;
      transition: color 0.2s;
      padding: 0 0.5rem;
    }
    .optix-modal-close:hover { color: var(--color-text); }
    .optix-modal-body { padding: 1.5rem; }
    .optix-modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      background: var(--color-surface-raised);
      border-radius: 0 0 16px 16px;
    }
    @media (max-width: 768px) {
      .optix-modal { max-width: 100% !important; margin: 0; border-radius: 12px; }
    }
  `;
  document.head.appendChild(style);
}

export default Modal;
