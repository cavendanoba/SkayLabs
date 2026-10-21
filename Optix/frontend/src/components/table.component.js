// frontend/src/components/table.component.js
import renderEmptyState from './empty-state.component.js';
import renderSkeleton from './skeleton.component.js';

export class DataTable {
  constructor({
    container,
    columns,
    onRowClick,
    onSearch,
    onPageChange,
    searchPlaceholder = 'Buscar...',
    actions = '',
    exportable = false,
    exportFilename = 'exportacion',
  } = {}) {
    this.container = container;
    this.columns = columns;
    this.onRowClick = onRowClick;
    this.onSearch = onSearch;
    this.onPageChange = onPageChange;
    this.searchPlaceholder = searchPlaceholder;
    this.actions = actions;
    this.exportable = exportable;
    this.exportFilename = exportFilename;
    this.searchTimeout = null;
    this._lastData = [];
  }

  render({ data = [], total = 0, page = 1, pages = 1, loading = false } = {}) {
    this._lastData = data;
    const exportBtn = this.exportable
      ? `<button class="btn btn-secondary btn-sm" id="dt-export-${this._id}" title="Exportar CSV">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
           CSV
         </button>`
      : '';

    this.container.innerHTML = `
      <div class="dt-toolbar">
        <div class="dt-search">
          <input
            type="text"
            class="dt-search-input"
            placeholder="${this.searchPlaceholder}"
            id="dt-search-${this._id}"
          />
        </div>
        <div class="dt-actions">${exportBtn}${this.actions}</div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              ${this.columns.map((col) => `<th>${col.header}</th>`).join('')}
            </tr>
          </thead>
          <tbody id="dt-body-${this._id}">
            ${loading ? renderSkeleton(5, 'row') : this._renderRows(data)}
          </tbody>
        </table>
      </div>

      ${this._renderPagination(page, pages, total)}
    `;

    this._attachEvents();
  }

  _renderRows(data) {
    if (!data.length) {
      return `<tr><td colspan="${this.columns.length}">${renderEmptyState({ icon: '📭', title: 'Sin resultados', description: 'No hay registros que coincidan' })}</td></tr>`;
    }
    return data.map((row) => `
      <tr class="dt-row" data-id="${row.id || ''}">
        ${this.columns.map((col) => `<td>${col.render ? col.render(row) : (row[col.key] ?? '—')}</td>`).join('')}
      </tr>
    `).join('');
  }

  _renderPagination(page, pages, total) {
    if (pages <= 1) return `<div class="dt-footer"><span class="dt-count">${total} registro${total !== 1 ? 's' : ''}</span></div>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    const pageButtons = [];

    for (let i = start; i <= end; i++) {
      pageButtons.push(`
        <button class="dt-page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>
      `);
    }

    return `
      <div class="dt-footer">
        <span class="dt-count">${total} registro${total !== 1 ? 's' : ''}</span>
        <div class="dt-pagination">
          <button class="dt-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>
          ${pageButtons.join('')}
          <button class="dt-page-btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;
  }

  _exportCSV() {
    if (!this._lastData.length) return;

    const headers = this.columns.map((col) => `"${col.header}"`).join(',');
    const rows = this._lastData.map((row) => {
      return this.columns.map((col) => {
        let val = col.csvValue
          ? col.csvValue(row)
          : col.render
            ? // Strip HTML tags from rendered content
              String(col.render(row)).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
            : (row[col.key] ?? '');
        // Escape double quotes and wrap
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.exportFilename}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _attachEvents() {
    // Export CSV
    const exportBtn = this.container.querySelector(`#dt-export-${this._id}`);
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this._exportCSV());
    }

    // Search
    const searchInput = this.container.querySelector(`#dt-search-${this._id}`);
    if (searchInput && this.onSearch) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.onSearch(e.target.value);
        }, 350);
      });
    }

    // Rows
    this.container.querySelectorAll('.dt-row').forEach((row) => {
      if (this.onRowClick) {
        row.addEventListener('click', () => this.onRowClick(row.dataset.id));
      }
    });

    // Pagination
    this.container.querySelectorAll('.dt-page-btn').forEach((btn) => {
      if (!btn.disabled && this.onPageChange) {
        btn.addEventListener('click', () => {
          const p = parseInt(btn.dataset.page);
          if (p > 0) this.onPageChange(p);
        });
      }
    });
  }

  get _id() {
    if (!this.__id) this.__id = Date.now();
    return this.__id;
  }

  showLoading() {
    const tbody = this.container.querySelector(`#dt-body-${this._id}`);
    if (tbody) tbody.innerHTML = renderSkeleton(5, 'row');
  }

  updateRows(data, total, page, pages) {
    this._lastData = data;
    const tbody = this.container.querySelector(`#dt-body-${this._id}`);
    if (tbody) tbody.innerHTML = this._renderRows(data);

    const footer = this.container.querySelector('.dt-footer');
    if (footer) footer.outerHTML = this._renderPagination(page, pages, total);

    this._attachEvents();
  }
}

// CSS
if (!document.querySelector('#table-styles')) {
  const style = document.createElement('style');
  style.id = 'table-styles';
  style.textContent = `
    .dt-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .dt-search-input {
      padding: 0.6rem 1rem;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      font-family: var(--font-family);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      min-width: 260px;
      transition: border-color 0.2s;
    }
    .dt-search-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }
    .dt-actions { display: flex; gap: 0.5rem; }
    .dt-row { cursor: pointer; }
    .dt-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .dt-count { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .dt-pagination { display: flex; gap: 0.25rem; }
    .dt-page-btn {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      border-radius: 6px;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: var(--font-size-sm);
      transition: all 0.2s;
    }
    .dt-page-btn:hover:not(:disabled) { background: var(--color-accent); color: var(--color-bg-dark); }
    .dt-page-btn.active { background: var(--color-accent); color: var(--color-bg-dark); font-weight: 700; }
    .dt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    @media (max-width: 768px) {
      .dt-toolbar { flex-direction: column; align-items: stretch; }
      .dt-search-input { min-width: auto; width: 100%; }
      .dt-footer { flex-direction: column; gap: 0.75rem; text-align: center; }
    }
  `;
  document.head.appendChild(style);
}

export default DataTable;
