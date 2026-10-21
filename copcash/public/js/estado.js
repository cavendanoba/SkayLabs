import { api } from './api.js';
import { proyectar, periodoDeFecha, sumarMeses, difMeses, resumenTarjeta } from './motor.js';

export const estado = { datos: null, cargado: 0 };

export async function cargar() {
  estado.datos = await api.get('/datos');
  estado.cargado = Date.now();
  return estado.datos;
}

/** Recarga si los datos tienen más de unos segundos (tu pareja pudo cambiar algo). */
export async function refrescar() {
  if (!estado.datos || Date.now() - estado.cargado > 5000) await cargar();
}

export const diaPago = () => estado.datos?.perfil?.dia_pago || 20;
/** Día en que se cierra cada periodo de gastos (del día de corte al día anterior del mes siguiente). */
export const diaCorte = () => estado.datos?.perfil?.dia_corte || diaPago();
export const periodoActual = () => periodoDeFecha(estado.datos?.hoy || new Date(), diaCorte());
/** Plata disponible hoy en tus cuentas activas: con eso arranca la proyección. */
export const disponibleHoy = () => (estado.datos.cuentas || []).filter((c) => c.activa).reduce((s, c) => s + Number(c.saldo), 0);

/**
 * Proyección con lo que tienes configurado: nómina y gastos (Ajustes), deudas, ahorros y cuentas.
 * Por defecto arranca en el próximo pago.
 */
export function proyeccion({ desde, meses = 12 } = {}) {
  const d = estado.datos;
  const inicio = desde || sumarMeses(periodoActual(), 1);
  return proyectar({
    perfil: d.perfil,
    deudas: d.deudas.map((x) => conFacturaPrevista(x, inicio)),
    recurrentes: d.recurrentes,
    categorias: d.categorias,
    ahorros: d.ahorros || [],
    parametros: { ahorro_inicial: disponibleHoy() },
    desde: inicio,
    meses,
  });
}

/**
 * Tarjeta con fecha de corte y pago: la factura que viene ya se conoce por sus compras, así que la
 * proyección usa ese valor en el periodo en que vence (el mismo "Próximo pago" de la tarjeta).
 */
function conFacturaPrevista(x, desde) {
  const d = estado.datos;
  if (x.tipo !== 'tarjeta' || !x.dia_corte || !x.dia_pago) return x;
  const rt = resumenTarjeta(x, (d.compras || []).filter((c) => c.deuda_id === x.id), d.hoy);
  if (!rt.vence || !(rt.estimado > 0)) return x;
  const clave = periodoDeFecha(rt.vence, diaCorte());
  if (difMeses(desde, clave) < 0) return x; // vence antes de lo que se proyecta
  return { ...x, pagos_previstos: { [clave]: rt.estimado } };
}

/** Cuentas activas y tarjetas (deudas tipo tarjeta) para escoger "con qué se pagó". Valores: "c:ID" o "t:ID". */
export function opcionesMedio({ cuentaId = null, deudaId = null, soloCuentas = false } = {}) {
  const d = estado.datos;
  const cuentas = (d.cuentas || []).filter((c) => c.activa || c.id === cuentaId);
  const tarjetas = soloCuentas ? [] : d.deudas.filter((x) => x.tipo === 'tarjeta' && (x.activa || x.id === deudaId));
  return { cuentas, tarjetas };
}

/** "c:3" → { cuenta_id: 3, deuda_id: null }; "t:5" → { cuenta_id: null, deuda_id: 5 } */
export function leerMedio(valor) {
  const [k, id] = String(valor || '').split(':');
  return { cuenta_id: k === 'c' ? Number(id) : null, deuda_id: k === 't' ? Number(id) : null };
}
