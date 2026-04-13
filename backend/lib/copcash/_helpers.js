// api/copcash/_helpers.js
// Helper compartido por todos los endpoints de CopCash.
// Archivos con prefijo _ no se exponen como rutas en Vercel.

import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.COPCASH_JWT_SECRET || 'copcash-dev-secret-changeme'
);

// ── Auth ───────────────────────────────────────────────────────────
export async function verifyToken(req) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) throw new Error('Token requerido');
  const token = auth.slice(7);
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload; // { userId, email }
}

export { JWT_SECRET };

// ── Respuestas ─────────────────────────────────────────────────────
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function json(res, status, data) {
  res.status(status).json(data);
}

// ── Manejo de errores comunes ──────────────────────────────────────
export function handleError(res, err) {
  if (err.message === 'Token requerido') return json(res, 401, { error: err.message });
  console.error('[CopCash API]', err);
  json(res, 500, { error: 'Error interno del servidor' });
}

// ── Mappers: fila de DB → forma que espera el frontend ─────────────

export function mapSalario(row) {
  return {
    monto:       Number(row.monto),
    diaCobro:    row.dia_cobro,
    descripcion: row.descripcion,
  };
}

export function mapCategoria(row) {
  return {
    id:          row.id,
    nombre:      row.nombre,
    icon:        row.icon,
    presupuesto: Number(row.presupuesto),
    color:       row.color,
  };
}

export function mapGastoFijo(row) {
  return {
    id:              row.id,
    nombre:          row.nombre,
    monto:           Number(row.monto),
    categoria:       row.categoria_id,   // frontend usa "categoria" (número)
    diaVencimiento:  row.dia_vencimiento,
    activo:          row.activo,
  };
}

export function mapGastoVariable(row) {
  return {
    id:        row.id,
    nombre:    row.nombre,
    monto:     Number(row.monto),
    fecha:     row.fecha,
    categoria: row.categoria_id,
    pagado:    row.pagado,
  };
}

export function mapIngresoExtra(row) {
  return {
    id:         row.id,
    nombre:     row.nombre,
    monto:      Number(row.monto),
    fecha:      row.fecha,
    categoria:  row.categoria_id,
    completado: row.completado,
  };
}

export function mapCompra(row) {
  return {
    id:                  row.id,
    nombre:              row.nombre,
    montoTotal:          Number(row.monto_total),
    cuotasTotal:         row.cuotas_total,
    cuotasPagadas:       row.cuotas_pagadas,
    cuotaActual:         row.cuota_actual,
    monto_cuota_fija:    Number(row.monto_cuota_fija),   // frontend mantiene snake para este campo
    fechaPrimeraCompra:  row.fecha_primera_compra,
    activa:              row.activa,
  };
}

export function mapTarjeta(row, compras = []) {
  // pagos_realizados viene como JSONB desde Postgres (ya es un array JS)
  return {
    id:                        row.id,
    nombre:                    row.nombre,
    banco:                     row.banco,
    limiteCrediticio:          Number(row.limite_crediticio),
    tasaInteresAnual:          Number(row.tasa_interes_anual),
    fechaCierre:               row.fecha_cierre,
    fechaPago:                 row.fecha_pago,
    saldoPeriodosAnteriores:   Number(row.saldo_periodos_anteriores),
    interesAcumulado:          Number(row.interes_acumulado),
    compras:                   compras.map(mapCompra),
    pagos_realizados:          row.pagos_realizados ?? [],
  };
}

export function mapMeta(row) {
  return {
    id:                    row.id,
    nombre:                row.nombre,
    montoObjetivo:         Number(row.monto_objetivo),
    montoActual:           Number(row.monto_actual),
    fechaObjetivo:         row.fecha_objetivo,
    aporteAutomatico:      row.aporte_automatico,
    aporteAutomaticoMonto: Number(row.aporte_automatico_monto),
  };
}
