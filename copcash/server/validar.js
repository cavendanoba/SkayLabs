export class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const esVacio = (v) => v === undefined || v === null || v === '';

/**
 * Valida y normaliza un objeto según un esquema simple.
 * Tipos: texto, numero, entero, bool, enum, fecha, id, periodo, json, cargos
 * Opciones: req, min, max, valores (enum), nulo (permite null), largo
 * parcial=true: solo valida los campos presentes (para PUT)
 */
export function validar(cuerpo, esquema, { parcial = false } = {}) {
  const out = {};
  const b = cuerpo || {};
  for (const [campo, regla] of Object.entries(esquema)) {
    const presente = Object.prototype.hasOwnProperty.call(b, campo);
    if (parcial && !presente) continue;
    let v = b[campo];
    if (esVacio(v)) {
      if (regla.req) throw new HttpError(400, `Falta el campo "${campo}".`);
      if (!presente && regla.def !== undefined) out[campo] = regla.def;
      else if (presente && regla.nulo !== false) out[campo] = null;
      else if (presente && regla.def !== undefined) out[campo] = regla.def;
      continue;
    }
    switch (regla.tipo) {
      case 'texto':
        v = String(v).trim();
        if (v.length > (regla.largo || 200)) throw new HttpError(400, `"${campo}" es demasiado largo.`);
        if (regla.req && !v) throw new HttpError(400, `Falta el campo "${campo}".`);
        break;
      case 'numero':
      case 'entero':
      case 'id': {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new HttpError(400, `"${campo}" debe ser un número.`);
        if ((regla.tipo === 'entero' || regla.tipo === 'id') && !Number.isInteger(n)) throw new HttpError(400, `"${campo}" debe ser un número entero.`);
        if (regla.min !== undefined && n < regla.min) throw new HttpError(400, `"${campo}" debe ser mayor o igual a ${regla.min}.`);
        if (regla.max !== undefined && n > regla.max) throw new HttpError(400, `"${campo}" debe ser menor o igual a ${regla.max}.`);
        v = n;
        break;
      }
      case 'bool':
        v = v === true || v === 'true' || v === 1 || v === '1';
        break;
      case 'enum':
        if (!regla.valores.includes(v)) throw new HttpError(400, `"${campo}" debe ser uno de: ${regla.valores.join(', ')}.`);
        break;
      case 'fecha':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new HttpError(400, `"${campo}" debe ser una fecha AAAA-MM-DD.`);
        break;
      case 'color':
        if (!/^#[0-9A-Fa-f]{6}$/.test(v)) throw new HttpError(400, `"${campo}" debe ser un color como #1E6B52.`);
        break;
      case 'periodo':
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new HttpError(400, `"${campo}" debe tener la forma AAAA-MM.`);
        break;
      case 'json':
        if (typeof v !== 'object') throw new HttpError(400, `"${campo}" debe ser un objeto.`);
        if (JSON.stringify(v).length > 50000) throw new HttpError(400, `"${campo}" es demasiado grande.`);
        break;
      case 'cargos': {
        // Lista de cobros fijos del mes: [{ nombre, valor }]
        if (!Array.isArray(v)) throw new HttpError(400, `"${campo}" debe ser una lista.`);
        if (v.length > 12) throw new HttpError(400, 'Máximo 12 cargos.');
        v = JSON.stringify(v.map((x) => {
          const nombre = String(x?.nombre ?? '').trim().slice(0, 60);
          const valor = Number(x?.valor);
          if (!nombre) throw new HttpError(400, 'Cada cargo necesita un nombre.');
          if (!Number.isFinite(valor) || valor < 0 || valor > 1e9) throw new HttpError(400, `Revisa el valor de "${nombre}".`);
          return { nombre, valor };
        }));
        break;
      }
      default:
        break;
    }
    out[campo] = v;
  }
  return out;
}

export const idParam = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Identificador inválido.');
  return n;
};
