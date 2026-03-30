// Modelo de Almacenamiento Central
// Maneja toda la persistencia en localStorage y operaciones CRUD

import { seedData } from '../../data/seedData.js';

class StorageModel {
  constructor() {
    this.storageKey = 'copcash_app_data';
    this.listeners = [];
    this.initializeStorage();
  }

  initializeStorage() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      localStorage.setItem(this.storageKey, JSON.stringify(seedData));
    }
  }

  getData() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : seedData;
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getData()));
  }

  // SALARIO
  setSalario(salario) {
    const data = this.getData();
    data.salario = salario;
    this.saveData(data);
  }

  getSalario() {
    return this.getData().salario;
  }

  // CATEGORÍAS
  getCategorias() {
    return this.getData().categorias;
  }

  getCategoria(id) {
    return this.getCategorias().find(c => c.id === id);
  }

  addCategoria(categoria) {
    const data = this.getData();
    categoria.id = Math.max(...data.categorias.map(c => c.id), 0) + 1;
    data.categorias.push(categoria);
    this.saveData(data);
    return categoria;
  }

  updateCategoria(id, updates) {
    const data = this.getData();
    const cat = data.categorias.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, updates);
      this.saveData(data);
    }
  }

  deleteCategoria(id) {
    const data = this.getData();
    data.categorias = data.categorias.filter(c => c.id !== id);
    this.saveData(data);
  }

  // GASTOS FIJOS
  getGastosFijos() {
    return this.getData().gastosFijos;
  }

  addGastoFijo(gasto) {
    const data = this.getData();
    gasto.id = Math.max(...data.gastosFijos.map(g => g.id), 0) + 1;
    data.gastosFijos.push(gasto);
    this.saveData(data);
    return gasto;
  }

  updateGastoFijo(id, updates) {
    const data = this.getData();
    const gasto = data.gastosFijos.find(g => g.id === id);
    if (gasto) {
      Object.assign(gasto, updates);
      this.saveData(data);
    }
  }

  deleteGastoFijo(id) {
    const data = this.getData();
    data.gastosFijos = data.gastosFijos.filter(g => g.id !== id);
    this.saveData(data);
  }

  // GASTOS VARIABLES
  getGastosVariables() {
    return this.getData().gastosVariables;
  }

  addGastoVariable(gasto) {
    const data = this.getData();
    gasto.id = Math.max(...data.gastosVariables.map(g => g.id), 0) + 1;
    data.gastosVariables.push(gasto);
    this.saveData(data);
    return gasto;
  }

  updateGastoVariable(id, updates) {
    const data = this.getData();
    const gasto = data.gastosVariables.find(g => g.id === id);
    if (gasto) {
      Object.assign(gasto, updates);
      this.saveData(data);
    }
  }

  deleteGastoVariable(id) {
    const data = this.getData();
    data.gastosVariables = data.gastosVariables.filter(g => g.id !== id);
    this.saveData(data);
  }

  // INGRESOS EXTRA
  getIngresosExtra() {
    return this.getData().ingresosExtra;
  }

  addIngresoExtra(ingreso) {
    const data = this.getData();
    ingreso.id = Math.max(...data.ingresosExtra.map(i => i.id), 0) + 1;
    data.ingresosExtra.push(ingreso);
    this.saveData(data);
    return ingreso;
  }

  updateIngresoExtra(id, updates) {
    const data = this.getData();
    const ingreso = data.ingresosExtra.find(i => i.id === id);
    if (ingreso) {
      Object.assign(ingreso, updates);
      this.saveData(data);
    }
  }

  deleteIngresoExtra(id) {
    const data = this.getData();
    data.ingresosExtra = data.ingresosExtra.filter(i => i.id !== id);
    this.saveData(data);
  }

  // TARJETAS
  getTarjetas() {
    return this.getData().tarjetas;
  }

  getTarjeta(id) {
    return this.getTarjetas().find(t => t.id === id);
  }

  addTarjeta(tarjeta) {
    const data = this.getData();
    tarjeta.id = Math.max(...data.tarjetas.map(t => t.id), 0) + 1;
    tarjeta.compras = [];
    data.tarjetas.push(tarjeta);
    this.saveData(data);
    return tarjeta;
  }

  updateTarjeta(id, updates) {
    const data = this.getData();
    const tarjeta = data.tarjetas.find(t => t.id === id);
    if (tarjeta) {
      Object.assign(tarjeta, updates);
      this.saveData(data);
    }
  }

  deleteTarjeta(id) {
    const data = this.getData();
    data.tarjetas = data.tarjetas.filter(t => t.id !== id);
    this.saveData(data);
  }

  // COMPRAS A CUOTAS
  addCompra(tarjetaId, compra) {
    const data = this.getData();
    const tarjeta = data.tarjetas.find(t => t.id === tarjetaId);
    if (tarjeta) {
      compra.id = Math.max(...tarjeta.compras.map(c => c.id), 0) + 1;
      tarjeta.compras.push(compra);
      this.saveData(data);
      return compra;
    }
  }

  updateCompra(tarjetaId, compraId, updates) {
    const data = this.getData();
    const tarjeta = data.tarjetas.find(t => t.id === tarjetaId);
    if (tarjeta) {
      const compra = tarjeta.compras.find(c => c.id === compraId);
      if (compra) {
        Object.assign(compra, updates);
        this.saveData(data);
      }
    }
  }

  deleteCompra(tarjetaId, compraId) {
    const data = this.getData();
    const tarjeta = data.tarjetas.find(t => t.id === tarjetaId);
    if (tarjeta) {
      tarjeta.compras = tarjeta.compras.filter(c => c.id !== compraId);
      this.saveData(data);
    }
  }

  // METAS DE AHORRO
  getMetas() {
    return this.getData().metas;
  }

  getMeta(id) {
    return this.getMetas().find(m => m.id === id);
  }

  addMeta(meta) {
    const data = this.getData();
    meta.id = Math.max(...data.metas.map(m => m.id), 0) + 1;
    meta.montoActual = meta.montoActual || 0;
    data.metas.push(meta);
    this.saveData(data);
    return meta;
  }

  updateMeta(id, updates) {
    const data = this.getData();
    const meta = data.metas.find(m => m.id === id);
    if (meta) {
      Object.assign(meta, updates);
      this.saveData(data);
    }
  }

  deleteMeta(id) {
    const data = this.getData();
    data.metas = data.metas.filter(m => m.id !== id);
    this.saveData(data);
  }

  // EXPORTAR/IMPORTAR
  exportData() {
    return JSON.stringify(this.getData(), null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.saveData(data);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  resetData() {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
  }
}

export const storage = new StorageModel();
