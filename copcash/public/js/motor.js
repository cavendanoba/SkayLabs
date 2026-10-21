// Motor de proyección por periodo de pago.
// Un periodo es "lo que llega el día de pago y alcanza hasta el día anterior al siguiente pago".
// Su clave es 'AAAA-MM' del mes en que empieza (con pago el 20: '2026-10' = 20 oct → 19 nov).
// Es código puro: lo usan el navegador y las pruebas del servidor.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function sumarMeses(clave, n) {
  const [a, m] = clave.split('-').map(Number);
  const t = a * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

export function difMeses(desde, hasta) {
  const [a1, m1] = desde.split('-').map(Number);
  const [a2, m2] = hasta.split('-').map(Number);
  return (a2 * 12 + m2) - (a1 * 12 + m1);
}

export function etiquetaPeriodo(clave, diaPago = 20) {
  const m = Number(clave.split('-')[1]);
  return `Pago ${diaPago} ${MESES[m - 1]}`;
}

export function nombreMes(clave) {
  const [a, m] = clave.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** Periodo al que pertenece una fecha (Date o 'AAAA-MM-DD'). */
export function periodoDeFecha(fecha, diaPago = 20) {
  const f = typeof fecha === 'string' ? new Date(`${fecha}T12:00:00`) : fecha;
  const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
  return f.getDate() >= diaPago ? clave : sumarMeses(clave, -1);
}

/** Fechas [inicio, fin] (ambas incluidas) de un periodo, como 'AAAA-MM-DD'. */
export function rangoPeriodo(clave, diaPago = 20) {
  const [a, m] = clave.split('-').map(Number);
  const ini = new Date(a, m - 1, diaPago, 12);
  const fin = new Date(a, m, diaPago - 1, 12);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return [iso(ini), iso(fin)];
}

/** Cuota fija de un crédito (sistema francés). */
export function cuotaFija(monto, tasaMensual, plazo) {
  if (plazo <= 0) return 0;
  if (!tasaMensual) return monto / plazo;
  return (monto * tasaMensual) / (1 - (1 + tasaMensual) ** -plazo);
}

export function tasaEfectivaAnual(tasaMensual) {
  return (1 + Number(tasaMensual || 0)) ** 12 - 1;
}

/**
 * Tasa mensual real de un crédito en el que recibes `recibes` y pagas `cuota` durante `plazo` meses.
 * Sirve para ver cuánto cuesta de verdad cuando hay comisiones (FGA, seguro) descontadas o sumadas.
 */
export function tasaReal(recibes, cuota, plazo) {
  let lo = 0, hi = 0.2;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    const vp = mid === 0 ? cuota * plazo : cuota * (1 - (1 + mid) ** -plazo) / mid;
    if (vp > recibes) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Tabla de plazos para un simulador de crédito. */
export function simularPlazos({ recibes, debes, tasaMensual, plazos }) {
  return plazos.map((plazo) => {
    const cuota = cuotaFija(debes, tasaMensual, plazo);
    const total = cuota * plazo;
    const real = tasaReal(recibes, cuota, plazo);
    return { plazo, cuota, total, costo: total - recibes, tasaRealMensual: real, tasaRealAnual: tasaEfectivaAnual(real) };
  });
}

const num = (v) => Number(v || 0);
const r0 = (v) => Math.round(v);

// ───────────── nómina ─────────────

/** Fondo de solidaridad pensional según cuántos salarios mínimos ganas. */
export function pctSolidaridad(bruto, minimo) {
  const r = minimo > 0 ? bruto / minimo : 0;
  if (r < 4) return 0;
  if (r < 16) return 0.01;
  if (r < 17) return 0.012;
  if (r < 18) return 0.014;
  if (r < 19) return 0.016;
  if (r < 20) return 0.018;
  return 0.02;
}

/** Aporte de un ahorro en cada pago: porcentaje del básico (pensión, cesantías) o valor fijo (cooperativa). */
export function aporteAhorro(a, perfil) {
  if (a.activa === false) return 0;
  if (a.pct_salario != null && Number(a.pct_salario) > 0) {
    // 8,33 % es "un salario al año": se usa la doceava exacta para no perder pesos por redondeo
    if (Math.abs(Number(a.pct_salario) - 1 / 12) < 0.0005) return num(perfil?.salario_bruto) / 12;
    return num(perfil?.salario_bruto) * Number(a.pct_salario);
  }
  return num(a.aporte_mensual);
}

/**
 * Desglose de la nómina de un periodo.
 * creditos: deudas por nómina con su cuota de ese periodo [{nombre, monto}]; si no se pasan, se toman las activas.
 */
export function calcularNomina(perfil, { deudas = [], ahorros = [], creditos = null } = {}) {
  const bruto = num(perfil?.salario_bruto);
  const auxilios = num(perfil?.auxilios);
  const salud = bruto * num(perfil?.pct_salud ?? 0.04);
  const pension = bruto * num(perfil?.pct_pension ?? 0.04);
  const fsp = bruto * pctSolidaridad(bruto, num(perfil?.salario_minimo) || 1750905);
  const retencion = num(perfil?.retencion);
  const otras = num(perfil?.otras_deducciones);
  const ahorrosNomina = ahorros.filter((a) => a.activa !== false && a.descuento_nomina)
    .map((a) => ({ nombre: a.nombre, monto: r0(aporteAhorro(a, perfil)) })).filter((a) => a.monto > 0);
  const creditosNomina = creditos ?? deudas.filter((d) => d.activa !== false && d.descuento_nomina && (d.cuotas_restantes == null || d.cuotas_restantes > 0))
    .map((d) => ({ nombre: d.nombre, monto: r0(num(d.cuota) * num(d.mi_porcentaje ?? 100) / 100) }));
  const suma = (l) => l.reduce((s, x) => s + x.monto, 0);
  const devengado = bruto + auxilios;
  const deducciones = salud + pension + fsp + retencion + otras + suma(ahorrosNomina) + suma(creditosNomina);
  return {
    bruto, auxilios, devengado,
    salud: r0(salud), pension: r0(pension), fsp: r0(fsp), retencion: r0(retencion), otras: r0(otras),
    ahorrosNomina, creditosNomina,
    deducciones: r0(deducciones),
    neto: r0(devengado - deducciones),
  };
}

/** Número de días de pago entre dos fechas (excluye la inicial, incluye la final). */
export function pagosEntre(desdeISO, hastaISO, diaPago = 20) {
  const d = new Date(`${desdeISO}T12:00:00`);
  const h = new Date(`${hastaISO}T12:00:00`);
  if (h <= d) return 0;
  let n = (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
  if (d.getDate() >= diaPago) n -= 1;
  if (h.getDate() >= diaPago) n += 1;
  return Math.max(0, n);
}

/** Saldo de un ahorro hoy: inicial + aportes automáticos por cada pago + aportes manuales. */
export function saldoAhorro(a, perfil, hoyISO, aportes = []) {
  const automaticos = a.pct_salario != null || a.descuento_nomina || num(a.aporte_mensual) > 0
    ? pagosEntre(String(a.fecha_inicial).slice(0, 10), hoyISO, num(perfil?.dia_pago) || 20) * aporteAhorro(a, perfil) : 0;
  const manuales = aportes.filter((x) => String(x.ahorro_id) === String(a.id)).reduce((s, x) => s + num(x.monto), 0);
  return { saldo: r0(num(a.saldo_inicial) + automaticos + manuales), automaticos: r0(automaticos), manuales: r0(manuales), porPago: r0(aporteAhorro(a, perfil)) };
}

/**
 * Proyecta mes a mes.
 * @param {object} datos
 *   perfil: { dia_pago, salario_bruto, salario_neto_base, prima_legal, prima_extralegal_pct, intereses_cesantias }
 *   deudas: [{ id, nombre, tipo, saldo, tasa_mensual, cuota, cuotas_restantes, mi_porcentaje, compartida, descuento_nomina, activa }]
 *   recurrentes: [{ id, nombre, monto, activo, categoria_id }]
 *   categorias: [{ id, nombre, presupuesto, activa, fija }] (las fijas no usan presupuesto)
 *   parametros: ver `parametrosPorDefecto`
 *   desde: 'AAAA-MM' primer periodo
 *   meses: cuántos periodos
 */
/**
 * Tasa con la que se proyecta el saldo de una deuda.
 * En un crédito de cuota fija (saldo, cuota y cuotas por pagar conocidos) se usa la tasa que hace que
 * esas cuotas paguen exactamente ese saldo: así la última cuota es igual a las demás aunque la cuota
 * incluya seguros o la tasa registrada no sea exacta. En lo demás, la tasa registrada.
 */
export function tasaDeAmortizacion(d) {
  const saldo = num(d.saldo); const cuota = num(d.cuota); const n = d.cuotas_restantes == null ? null : Number(d.cuotas_restantes);
  if (d.tipo !== 'tarjeta' && n > 0 && saldo > 0 && cuota > 0 && cuota * n >= saldo) return tasaReal(saldo, cuota, n);
  return num(d.tasa_mensual);
}

export function proyectar({ perfil, deudas = [], recurrentes = [], categorias = [], ahorros = [], parametros = {}, desde, meses = 12 }) {
  const p = { ...parametrosPorDefecto(), ...parametros };
  const diaPago = num(perfil?.dia_pago) || 20;
  const bruto = num(perfil?.salario_bruto);

  // Estado de cada deuda a lo largo de la proyección
  const estado = deudas.filter((d) => d.activa !== false).map((d) => ({
    ...d,
    saldo: num(d.saldo),
    tasa: tasaDeAmortizacion(d),
    cuota: num(d.cuota),
    restantes: d.cuotas_restantes == null ? null : Number(d.cuotas_restantes),
    liquidar: (p.liquidar || []).find((l) => String(l.deuda_id) === String(d.id))?.periodo || null,
    // Sin saldo ni número de cuotas: se paga la cuota todos los meses (p. ej. Icetex sin saldo conocido)
    abierta: d.cuotas_restantes == null && !(Number(d.saldo) > 0),
    historial: [],
  }));

  // Crédito nuevo del escenario (p. ej. un préstamo que estás pensando sacar)
  const c = p.credito;
  if (c && c.activo) {
    estado.push({
      id: 'credito-escenario',
      nombre: c.nombre || 'Crédito nuevo',
      tipo: 'credito',
      saldo: 0,
      tasa: num(c.tasa_mensual),
      cuota: 0,
      restantes: null,
      mi_porcentaje: 100,
      compartida: false,
      descuento_nomina: !!c.por_nomina,
      virtual: true,
      historial: [],
    });
  }

  const periodos = [];
  let acumulado = num(p.ahorro_inicial);

  for (let i = 0; i < meses; i += 1) {
    const clave = sumarMeses(desde, i);
    const mes = Number(clave.split('-')[1]);

    const ingresos = [];
    const nomina = [];
    const fijos = [];
    const pagosDeuda = [];
    const variables = [];
    const unicos = [];

    // --- Deudas: cuotas del periodo
    for (const d of estado) {
      let pago = 0;
      let nota = '';
      if (d.virtual) {
        if (clave === c.periodo_desembolso) {
          d.saldo = num(c.debes);
          d.restantes = num(c.plazo);
          d.cuota = cuotaFija(d.saldo, d.tasa, d.restantes);
          d.iniciado = true;
        }
        if (!d.iniciado) { d.historial.push({ clave, pago: 0, saldo: 0 }); continue; }
        if (c.periodo_primera_cuota && difMeses(c.periodo_primera_cuota, clave) < 0) {
          d.saldo *= 1 + d.tasa; // aún no empieza a pagar: el interés corre
          d.cuota = cuotaFija(d.saldo, d.tasa, d.restantes);
          d.historial.push({ clave, pago: 0, saldo: d.saldo });
          continue;
        }
      }
      const vigente = d.abierta || (d.restantes == null ? d.saldo > 0.5 : d.restantes > 0);
      const yaLiquidada = d.liquidar && difMeses(d.liquidar, clave) > 0;
      if (!vigente || yaLiquidada) { d.historial.push({ clave, pago: 0, saldo: d.saldo }); continue; }

      const interes = d.saldo * d.tasa;
      // pago anunciado de la factura que vence en este periodo (tarjetas con compras registradas)
      const fijo = d.pagos_previstos?.[clave];
      if (d.liquidar === clave) {
        // la tarjeta pagada completa antes del corte no genera intereses
        pago = d.tipo === 'tarjeta' ? d.saldo : d.saldo + interes;
        nota = 'pago total';
        d.saldo = 0;
        d.restantes = 0;
        d.abierta = false;
      } else if (d.abierta) {
        pago = d.cuota;
      } else if (d.restantes != null) {
        pago = d.cuota;
        if (d.saldo > 0) {
          pago = d.restantes === 1 ? d.saldo + interes : Math.min(pago, d.saldo + interes);
          d.saldo = Math.max(0, d.saldo + interes - pago);
        }
        d.restantes -= 1;
        if (d.restantes === 0) d.saldo = 0;
      } else if (fijo != null) {
        // la factura ya está armada con las cuotas de cada compra y los cobros fijos
        pago = Math.min(fijo, d.saldo + interes);
        d.saldo = Math.max(0, d.saldo + interes - pago);
      } else {
        pago = Math.min(d.cuota, d.saldo + interes);
        d.saldo = Math.max(0, d.saldo + interes - pago);
      }
      // Abono extraordinario del escenario al crédito nuevo: reduce la cuota
      if (d.virtual && c.abono && c.abono.periodo === clave && num(c.abono.monto) > 0 && d.saldo > 0) {
        const abono = Math.min(num(c.abono.monto), d.saldo);
        d.saldo -= abono;
        d.cuota = d.restantes > 0 ? cuotaFija(d.saldo, d.tasa, d.restantes) : 0;
        unicos.push({ nombre: `Abono a capital ${d.nombre}`, monto: r0(abono) });
      }
      d.historial.push({ clave, pago, saldo: d.saldo });
      if (pago <= 0) continue;

      let pct = num(d.mi_porcentaje ?? 100) / 100;
      const miParte = r0(pago * pct);
      const item = { nombre: d.nombre + (nota ? ` (${nota})` : ''), monto: miParte, deuda_id: d.id };
      if (d.descuento_nomina) nomina.push(item);
      else if (nota) unicos.push(item);
      else pagosDeuda.push(item);
    }

    // --- Ingresos
    const n = calcularNomina(perfil, { ahorros, creditos: nomina });
    ingresos.push({ nombre: 'Salario consignado', monto: n.neto, detalle: [...n.ahorrosNomina.map((x) => ({ ...x, ahorro: true })), ...nomina], nomina: n });
    if (perfil?.prima_legal && (mes === 6 || mes === 12)) ingresos.push({ nombre: 'Prima legal', monto: r0(bruto / 2) });
    if (num(perfil?.prima_extralegal_pct) > 0 && mes === 12) ingresos.push({ nombre: 'Prima extralegal', monto: r0(bruto * num(perfil.prima_extralegal_pct)) });
    if (perfil?.intereses_cesantias && mes === 1) ingresos.push({ nombre: 'Intereses de cesantías', monto: r0(bruto * 0.12) });
    if (c && c.activo && clave === c.periodo_desembolso) ingresos.push({ nombre: `Desembolso ${c.nombre || 'crédito'}`, monto: r0(num(c.recibes)) });

    // --- Gastos recurrentes
    for (const g of recurrentes) {
      if (g.activo === false) continue;
      const monto = num(g.monto);
      const item = { nombre: g.nombre, monto: r0(monto), categoria_id: g.categoria_id };
      fijos.push(item);
    }

    // --- Gasto variable (presupuesto por categoría)
    for (const cat of categorias) {
      if (cat.activa === false || cat.fija || num(cat.presupuesto) <= 0) continue; // en las fijas cuentan sus gastos fijos
      variables.push({ nombre: cat.nombre, monto: r0(num(cat.presupuesto)), categoria_id: cat.id });
    }

    // --- Eventos únicos
    for (const e of p.eventos || []) {
      if (e.periodo !== clave || !num(e.monto)) continue;
      if (e.tipo === 'ingreso') ingresos.push({ nombre: e.nombre, monto: r0(num(e.monto)) });
      else unicos.push({ nombre: e.nombre, monto: r0(num(e.monto)) });
    }

    const suma = (l) => l.reduce((s, x) => s + x.monto, 0);
    const entra = suma(ingresos);
    const sale = suma(fijos) + suma(pagosDeuda) + suma(variables) + suma(unicos);
    const resultado = entra - sale;
    acumulado += resultado;

    periodos.push({
      clave,
      etiqueta: etiquetaPeriodo(clave, diaPago),
      grupos: { ingresos, fijos, deudas: pagosDeuda, variables, unicos },
      totales: {
        entra,
        fijos: suma(fijos),
        deudas: suma(pagosDeuda),
        variables: suma(variables),
        unicos: suma(unicos),
        sale,
        resultado,
        acumulado,
      },
    });
  }

  const primerRojo = periodos.find((x) => x.totales.acumulado < 0) || null;
  const deudasFinal = estado.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    saldoFinal: r0(d.saldo),
    // Último periodo con pago, si la deuda queda saldada dentro de la proyección
    terminaEn: (() => {
      const h = d.historial;
      let ult = -1;
      h.forEach((x, k) => { if (x.pago > 0) ult = k; });
      if (ult < 0) return null;
      const saldada = d.restantes === 0 || (!d.abierta && d.saldo <= 0.5);
      return ult < h.length - 1 || saldada ? h[ult].clave : null;
    })(),
    historial: d.historial.map((x) => ({ clave: x.clave, pago: r0(x.pago), saldo: r0(x.saldo) })),
  }));

  return { periodos, primerRojo: primerRojo ? primerRojo.clave : null, minimo: Math.min(...periodos.map((x) => x.totales.acumulado)), deudas: deudasFinal };
}

export function parametrosPorDefecto() {
  return {
    ahorro_inicial: 0,
    credito: null,
    liquidar: [],
    eventos: [],
  };
}

// ───────────── tarjetas de crédito ─────────────

const isoFecha = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fechaEn = (anio, mes0, dia) => new Date(anio, mes0, Math.min(dia, new Date(anio, mes0 + 1, 0).getDate()), 12);

/** Primera fecha con ese día del mes estrictamente después de `iso` (o en `iso` si incluir=true). */
export function proximaFechaDia(iso, dia, incluir = false) {
  const f = new Date(`${iso}T12:00:00`);
  let c = fechaEn(f.getFullYear(), f.getMonth(), dia);
  if (c < f || (!incluir && isoFecha(c) === iso)) c = fechaEn(f.getFullYear(), f.getMonth() + 1, dia);
  return isoFecha(c);
}

/** Último corte en o antes de `iso`. */
export function corteAnterior(iso, dia) {
  const f = new Date(`${iso}T12:00:00`);
  let c = fechaEn(f.getFullYear(), f.getMonth(), dia);
  if (c > f) c = fechaEn(f.getFullYear(), f.getMonth() - 1, dia);
  return isoFecha(c);
}

export const valorCuota = (c) => (c.cuota_valor != null && Number(c.cuota_valor) > 0 ? Number(c.cuota_valor) : Number(c.monto) / Math.max(1, Number(c.cuotas) || 1));
/** Cobros fijos del mes de una tarjeta (cuota de manejo, seguros…). */
export function cargosTarjeta(t) {
  const lista = Array.isArray(t.cargos) ? t.cargos : [];
  if (!lista.length && Number(t.cuota_manejo) > 0) return [{ nombre: 'Cuota de manejo', valor: Number(t.cuota_manejo) }];
  return lista.map((c) => ({ nombre: c.nombre, valor: Number(c.valor) || 0 }));
}
export const totalCargos = (t) => cargosTarjeta(t).reduce((s, c) => s + c.valor, 0);

export const cuotasPendientes = (c) => Math.max(0, (Number(c.cuotas) || 1) - (Number(c.cuotas_pagadas) || 0));

/**
 * Estado de una tarjeta: qué factura toca pagar, cuándo y cuánto, según sus compras.
 * Si hoy está entre el corte y la fecha de pago, la factura es la del corte que ya pasó.
 */
export function resumenTarjeta(t, compras, hoyISO) {
  const pendientes = compras.filter((c) => cuotasPendientes(c) > 0);
  const detallado = pendientes.reduce((s, c) => s + valorCuota(c) * cuotasPendientes(c), 0);
  let corte = null;
  let vence = null;
  if (t.dia_corte) {
    const uc = corteAnterior(hoyISO, t.dia_corte);
    const pagoUC = t.dia_pago ? proximaFechaDia(uc, t.dia_pago) : null;
    if (pagoUC && pagoUC >= hoyISO && uc < hoyISO) { corte = uc; vence = pagoUC; } else {
      corte = proximaFechaDia(hoyISO, t.dia_corte, true);
      vence = t.dia_pago ? proximaFechaDia(corte, t.dia_pago) : null;
    }
    // Si esa factura ya se pagó, lo que sigue es la del corte siguiente
    const pagado = t.ultimo_corte_pagado ? String(t.ultimo_corte_pagado).slice(0, 10) : null;
    while (pagado && corte <= pagado) {
      corte = proximaFechaDia(corte, t.dia_corte);
      vence = t.dia_pago ? proximaFechaDia(corte, t.dia_pago) : null;
    }
  }
  const enFactura = pendientes.filter((c) => !corte || String(c.fecha).slice(0, 10) <= corte);
  const cuotas = enFactura.reduce((s, c) => s + valorCuota(c), 0);
  const saldo = Number(t.saldo) || 0;
  const cupo = t.cupo != null ? Number(t.cupo) : null;
  const sinDetallar = Math.max(0, saldo - detallado);
  let factura = cuotas + totalCargos(t);
  // Si parte del saldo no está en compras registradas, esa parte también se paga: se usa al menos
  // la cuota mensual que configuraste para la tarjeta (si no, la factura saldría solo con el manejo).
  if (sinDetallar > 1) factura = Math.max(factura, Number(t.cuota) || 0);
  return {
    corte, vence,
    diasParaPagar: vence ? Math.round((new Date(`${vence}T12:00:00`) - new Date(`${hoyISO}T12:00:00`)) / 864e5) : null,
    enFactura, pendientes,
    // nunca más de lo que se debe
    cargos: r0(totalCargos(t)),
    estimado: r0(saldo > 0 ? Math.min(saldo, factura) : factura),
    detallado: r0(detallado),
    sinDetallar: r0(sinDetallar),
    disponible: cupo != null ? r0(Math.max(0, cupo - saldo)) : null,
    uso: cupo ? Math.min(1, saldo / cupo) : null,
  };
}
