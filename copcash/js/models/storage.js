// Modelo de Almacenamiento — CopCash
// Usa cache en memoria + API REST en Neon (Vercel serverless).
// Getters: sincronicos (leen del cache).
// Escrituras: async (llaman a la API y actualizan el cache).

const BASE = '/api/copcash';

class StorageModel {
  constructor() {
    this.cache = null;
    this.listeners = [];
  }

  // Auth
  get token() {
    return localStorage.getItem('copcash_token');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    const raw = localStorage.getItem('copcash_user');
    return raw ? JSON.parse(raw) : null;
  }

  async login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesion');
    localStorage.setItem('copcash_token', data.token);
    localStorage.setItem('copcash_user', JSON.stringify(data.user));
    return data.user;
  }

  async register(email, password, nombre) {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');
    localStorage.setItem('copcash_token', data.token);
    localStorage.setItem('copcash_user', JSON.stringify(data.user));
    return data.user;
  }

  logout() {
    localStorage.removeItem('copcash_token');
    localStorage.removeItem('copcash_user');
    this.cache = null;
  }

  async _req(path, options = {}) {
    const res = await fetch(BASE + path, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      ...options
    });
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  }

  // Carga inicial
  async refresh() {
    const [salario, categorias, gastosFijos, gastosVariables, ingresosExtra, tarjetas, metas] =
      await Promise.all([
        this._req('/salario'),
        this._req('/categorias'),
        this._req('/gastos-fijos'),
        this._req('/gastos-variables'),
        this._req('/ingresos-extra'),
        this._req('/tarjetas'),
        this._req('/metas')
      ]);

    this.cache = {
      salario,
      categorias,
      gastosFijos,
      gastosVariables,
      ingresosExtra,
      tarjetas,
      metas
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.cache));
  }

  // SALARIO
  getSalario() {
    return this.cache?.salario ?? null;
  }

  async setSalario(salario) {
    const updated = await this._req('/salario', {
      method: 'PUT',
      body: JSON.stringify(salario)
    });
    this.cache.salario = updated;
    this.notifyListeners();
  }

  // CATEGORIAS
  getCategorias() {
    return this.cache?.categorias ?? [];
  }

  getCategoria(id) {
    return this.getCategorias().find((c) => c.id === id);
  }

  async addCategoria(categoria) {
    const created = await this._req('/categorias', {
      method: 'POST',
      body: JSON.stringify(categoria)
    });
    this.cache.categorias.push(created);
    this.notifyListeners();
    return created;
  }

  async updateCategoria(id, updates) {
    const updated = await this._req(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.categorias.findIndex((c) => c.id === id);
    if (idx !== -1) this.cache.categorias[idx] = updated;
    this.notifyListeners();
  }

  async deleteCategoria(id) {
    await this._req(`/categorias/${id}`, { method: 'DELETE' });
    this.cache.categorias = this.cache.categorias.filter((c) => c.id !== id);
    this.notifyListeners();
  }

  // GASTOS FIJOS
  getGastosFijos() {
    return this.cache?.gastosFijos ?? [];
  }

  async addGastoFijo(gasto) {
    const created = await this._req('/gastos-fijos', {
      method: 'POST',
      body: JSON.stringify(gasto)
    });
    this.cache.gastosFijos.push(created);
    this.notifyListeners();
    return created;
  }

  async updateGastoFijo(id, updates) {
    const updated = await this._req(`/gastos-fijos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.gastosFijos.findIndex((g) => g.id === id);
    if (idx !== -1) this.cache.gastosFijos[idx] = updated;
    this.notifyListeners();
  }

  async deleteGastoFijo(id) {
    await this._req(`/gastos-fijos/${id}`, { method: 'DELETE' });
    this.cache.gastosFijos = this.cache.gastosFijos.filter((g) => g.id !== id);
    this.notifyListeners();
  }

  // GASTOS VARIABLES
  getGastosVariables() {
    return this.cache?.gastosVariables ?? [];
  }

  async addGastoVariable(gasto) {
    const created = await this._req('/gastos-variables', {
      method: 'POST',
      body: JSON.stringify(gasto)
    });
    this.cache.gastosVariables.push(created);
    this.notifyListeners();
    return created;
  }

  async updateGastoVariable(id, updates) {
    const updated = await this._req(`/gastos-variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.gastosVariables.findIndex((g) => g.id === id);
    if (idx !== -1) this.cache.gastosVariables[idx] = updated;
    this.notifyListeners();
  }

  async deleteGastoVariable(id) {
    await this._req(`/gastos-variables/${id}`, { method: 'DELETE' });
    this.cache.gastosVariables = this.cache.gastosVariables.filter((g) => g.id !== id);
    this.notifyListeners();
  }

  // INGRESOS EXTRA
  getIngresosExtra() {
    return this.cache?.ingresosExtra ?? [];
  }

  async addIngresoExtra(ingreso) {
    const created = await this._req('/ingresos-extra', {
      method: 'POST',
      body: JSON.stringify(ingreso)
    });
    this.cache.ingresosExtra.push(created);
    this.notifyListeners();
    return created;
  }

  async updateIngresoExtra(id, updates) {
    const updated = await this._req(`/ingresos-extra/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.ingresosExtra.findIndex((i) => i.id === id);
    if (idx !== -1) this.cache.ingresosExtra[idx] = updated;
    this.notifyListeners();
  }

  async deleteIngresoExtra(id) {
    await this._req(`/ingresos-extra/${id}`, { method: 'DELETE' });
    this.cache.ingresosExtra = this.cache.ingresosExtra.filter((i) => i.id !== id);
    this.notifyListeners();
  }

  // TARJETAS
  getTarjetas() {
    return this.cache?.tarjetas ?? [];
  }

  getTarjeta(id) {
    return this.getTarjetas().find((t) => t.id === id);
  }

  async addTarjeta(tarjeta) {
    const created = await this._req('/tarjetas', {
      method: 'POST',
      body: JSON.stringify(tarjeta)
    });
    this.cache.tarjetas.push(created);
    this.notifyListeners();
    return created;
  }

  async updateTarjeta(id, updates) {
    const updated = await this._req(`/tarjetas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.tarjetas.findIndex((t) => t.id === id);
    if (idx !== -1) this.cache.tarjetas[idx] = updated;
    this.notifyListeners();
  }

  async deleteTarjeta(id) {
    await this._req(`/tarjetas/${id}`, { method: 'DELETE' });
    this.cache.tarjetas = this.cache.tarjetas.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  // COMPRAS A CUOTAS
  async addCompra(tarjetaId, compra) {
    const created = await this._req(`/tarjetas/${tarjetaId}/compras`, {
      method: 'POST',
      body: JSON.stringify(compra)
    });
    const tarjeta = this.getTarjeta(tarjetaId);
    if (tarjeta) tarjeta.compras.push(created);
    this.notifyListeners();
    return created;
  }

  async updateCompra(tarjetaId, compraId, updates) {
    const updated = await this._req(`/tarjetas/${tarjetaId}/compras/${compraId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const tarjeta = this.getTarjeta(tarjetaId);
    if (tarjeta) {
      const idx = tarjeta.compras.findIndex((c) => c.id === compraId);
      if (idx !== -1) tarjeta.compras[idx] = updated;
    }
    this.notifyListeners();
  }

  async deleteCompra(tarjetaId, compraId) {
    await this._req(`/tarjetas/${tarjetaId}/compras/${compraId}`, { method: 'DELETE' });
    const tarjeta = this.getTarjeta(tarjetaId);
    if (tarjeta) tarjeta.compras = tarjeta.compras.filter((c) => c.id !== compraId);
    this.notifyListeners();
  }

  // METAS
  getMetas() {
    return this.cache?.metas ?? [];
  }

  getMeta(id) {
    return this.getMetas().find((m) => m.id === id);
  }

  async addMeta(meta) {
    const created = await this._req('/metas', {
      method: 'POST',
      body: JSON.stringify(meta)
    });
    this.cache.metas.push(created);
    this.notifyListeners();
    return created;
  }

  async updateMeta(id, updates) {
    const updated = await this._req(`/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const idx = this.cache.metas.findIndex((m) => m.id === id);
    if (idx !== -1) this.cache.metas[idx] = updated;
    this.notifyListeners();
  }

  async deleteMeta(id) {
    await this._req(`/metas/${id}`, { method: 'DELETE' });
    this.cache.metas = this.cache.metas.filter((m) => m.id !== id);
    this.notifyListeners();
  }

  // EXPORTAR/IMPORTAR/RESET
  exportData() {
    return JSON.stringify(this.cache ?? {}, null, 2);
  }

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.salario) await this.setSalario(data.salario);
      for (const c of data.categorias || []) await this.addCategoria(c);
      for (const g of data.gastosFijos || []) await this.addGastoFijo(g);
      for (const g of data.gastosVariables || []) await this.addGastoVariable(g);
      for (const i of data.ingresosExtra || []) await this.addIngresoExtra(i);
      for (const t of data.tarjetas || []) {
        const created = await this.addTarjeta(t);
        for (const compra of t.compras || []) {
          await this.addCompra(created.id, compra);
        }
      }
      for (const m of data.metas || []) await this.addMeta(m);
      await this.refresh();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  async resetData() {
    // No borramos en backend sin endpoint dedicado; solo refresca estado.
    await this.refresh();
    this.notifyListeners();
  }
}

export const storage = new StorageModel();
