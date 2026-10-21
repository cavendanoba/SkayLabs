import test from 'node:test';
import assert from 'node:assert/strict';
import { proyectar, periodoDeFecha, rangoPeriodo, cuotaFija, simularPlazos, sumarMeses, calcularNomina, saldoAhorro, pagosEntre } from '../public/js/motor.js';

// Devengado 3.925.620 − salud 156.000 − pensión 156.000 − otras 154.600 = 3.459.020 antes de créditos por nómina
const perfil = { dia_pago: 20, salario_bruto: 3900000, auxilios: 25620, otras_deducciones: 154600, salario_minimo: 1750905, pct_salud: 0.04, pct_pension: 0.04, prima_legal: true, prima_extralegal_pct: 0.4, intereses_cesantias: true };

test('periodos de pago del 20 al 19', () => {
  assert.equal(periodoDeFecha('2026-10-13'), '2026-09');
  assert.equal(periodoDeFecha('2026-10-20'), '2026-10');
  assert.deepEqual(rangoPeriodo('2026-12'), ['2026-12-20', '2027-01-19']);
  assert.equal(sumarMeses('2026-11', 3), '2027-02');
});

test('créditos por nómina se restan del salario y al terminar lo liberan', () => {
  const deudas = [{ id: 1, nombre: 'FEC', tipo: 'nomina', saldo: 0, tasa_mensual: 0, cuota: 300000, cuotas_restantes: 2, descuento_nomina: true, mi_porcentaje: 100 }];
  const r = proyectar({ perfil, deudas, desde: '2026-10', meses: 3 });
  const sal = r.periodos.map((p) => p.grupos.ingresos[0].monto);
  assert.deepEqual(sal, [3159020, 3159020, 3459020]);
});

test('primas en junio y diciembre, cesantías en enero', () => {
  const r = proyectar({ perfil, desde: '2026-11', meses: 8 });
  const extra = Object.fromEntries(r.periodos.map((p) => [p.clave, p.totales.entra - p.grupos.ingresos[0].monto]));
  assert.equal(extra['2026-12'], 1950000 + 1560000);
  assert.equal(extra['2027-01'], 468000);
  assert.equal(extra['2027-06'], 1950000);
  assert.equal(extra['2027-03'], 0);
});

test('gastos fijos: solo los activos, por su valor completo', () => {
  const recurrentes = [
    { nombre: 'Arriendo', monto: 850000, activo: true },
    { nombre: 'Gimnasio', monto: 90000, activo: false },
  ];
  const r = proyectar({ perfil, recurrentes, desde: '2026-11', meses: 2 });
  assert.deepEqual(r.periodos.map((p) => p.totales.fijos), [850000, 850000]);
});

test('crédito nuevo: desembolso, cuota fija y abono que la reduce', () => {
  const credito = { activo: true, nombre: 'FEC', recibes: 2500000, debes: 2602676, tasa_mensual: 0.0125, plazo: 15, periodo_desembolso: '2026-10', periodo_primera_cuota: '2026-11', por_nomina: true, abono: { periodo: '2026-12', monto: 1000000 } };
  const r = proyectar({ perfil, desde: '2026-10', meses: 4, parametros: { credito } });
  const [oct, nov, dic, ene] = r.periodos;
  assert.equal(oct.grupos.ingresos.find((x) => x.nombre.startsWith('Desembolso')).monto, 2500000);
  const cuotaNov = nov.grupos.ingresos[0].detalle[0].monto;
  assert.equal(cuotaNov, Math.round(cuotaFija(2602676 * 1.0125, 0.0125, 15)));
  assert.equal(dic.totales.unicos, 1000000);
  assert.ok(ene.grupos.ingresos[0].detalle[0].monto < cuotaNov * 0.7);
});

test('liquidar una tarjeta paga el saldo y luego no hay más cuotas', () => {
  const deudas = [{ id: 7, nombre: 'Falabella', tipo: 'tarjeta', saldo: 643055, tasa_mensual: 0, cuota: 520000, cuotas_restantes: null, mi_porcentaje: 100 }];
  const r = proyectar({ perfil, deudas, desde: '2026-10', meses: 3, parametros: { liquidar: [{ deuda_id: 7, periodo: '2026-10' }] } });
  assert.equal(r.periodos[0].totales.unicos, 643055);
  assert.equal(r.periodos[1].totales.deudas, 0);
  assert.equal(r.deudas[0].terminaEn, '2026-10');
});

test('simulador: comisiones suben la tasa real', () => {
  const [f] = simularPlazos({ recibes: 2500000, debes: 2602676, tasaMensual: 0.0125, plazos: [15] });
  assert.equal(Math.round(f.cuota), 191366);
  assert.ok(f.tasaRealAnual > 0.23 && f.tasaRealAnual < 0.24);
});

test('ahorro acumulado y primer periodo en rojo', () => {
  const r = proyectar({ perfil: { dia_pago: 20, salario_bruto: 0, auxilios: 1000000, prima_legal: false, prima_extralegal_pct: 0, intereses_cesantias: false },
    recurrentes: [{ nombre: 'Gasto', monto: 1200000 }], desde: '2026-10', meses: 3, parametros: { ahorro_inicial: 300000 } });
  assert.deepEqual(r.periodos.map((p) => p.totales.acumulado), [100000, -100000, -300000]);
  assert.equal(r.primerRojo, '2026-11');
});

test('nómina calculada coincide con el desprendible de septiembre', () => {
  const p = { salario_bruto: 3900000, auxilios: 25620, otras_deducciones: 4600, salario_minimo: 1750905, pct_salud: 0.04, pct_pension: 0.04 };
  const ahorros = [{ nombre: 'FEC', descuento_nomina: true, aporte_mensual: 150000 }];
  const deudas = [
    { nombre: 'Libre inversión', descuento_nomina: true, cuota: 229639, cuotas_restantes: 12 },
    { nombre: 'Emermédica', descuento_nomina: true, cuota: 85750, cuotas_restantes: 11 },
    { nombre: 'Parque', descuento_nomina: true, cuota: 61082, cuotas_restantes: 1 },
  ];
  const n = calcularNomina(p, { deudas, ahorros });
  assert.equal(n.salud, 156000);
  assert.equal(n.fsp, 0);
  assert.equal(n.deducciones, 843071);
  assert.equal(n.neto, 3082549);
  // con 5 mínimos aplica el 1 % de solidaridad
  assert.equal(calcularNomina({ ...p, salario_bruto: 1750905 * 5 }).fsp, Math.round(1750905 * 5 * 0.01));
});

test('ahorros: aportes automáticos por cada pago y manuales', () => {
  assert.equal(pagosEntre('2026-09-30', '2026-10-14'), 0);
  assert.equal(pagosEntre('2026-09-30', '2026-10-20'), 1);
  assert.equal(pagosEntre('2026-09-30', '2027-01-25'), 4);
  const a = { id: 1, saldo_inicial: 1498963, fecha_inicial: '2026-09-30', aporte_mensual: 120000, descuento_nomina: true };
  const s = saldoAhorro(a, { dia_pago: 20 }, '2026-12-01', [{ ahorro_id: 1, monto: 50000 }]);
  assert.equal(s.saldo, 1498963 + 2 * 120000 + 50000);
  const pension = { id: 2, saldo_inicial: 0, fecha_inicial: '2026-10-01', pct_salario: 0.16 };
  assert.equal(saldoAhorro(pension, { dia_pago: 20, salario_bruto: 3900000 }, '2026-10-20').saldo, 624000);
});

test('tarjeta: factura del corte, fecha de pago y compras en cuotas', async () => {
  const { resumenTarjeta, proximaFechaDia, corteAnterior } = await import('../public/js/motor.js');
  assert.equal(proximaFechaDia('2026-10-14', 19, true), '2026-10-19');
  assert.equal(proximaFechaDia('2026-10-19', 5), '2026-11-05');
  assert.equal(corteAnterior('2026-10-14', 19), '2026-09-19');
  const t = { saldo: 643055, cupo: 800000, dia_corte: 19, dia_pago: 5, cargos: [{ nombre: 'Cuota de manejo', valor: 31990 }] };
  const compras = [
    { fecha: '2026-08-13', monto: 410623, cuotas: 4, cuotas_pagadas: 2, cuota_valor: 102656 },
    { fecha: '2026-10-05', monto: 66779, cuotas: 1, cuotas_pagadas: 0 },
    { fecha: '2026-10-21', monto: 50000, cuotas: 1, cuotas_pagadas: 0 },
  ];
  // 14 oct: el corte que viene es el 19 oct y se paga el 5 nov; la compra del 21 queda para el siguiente
  const r = resumenTarjeta(t, compras, '2026-10-14');
  assert.equal(r.corte, '2026-10-19');
  assert.equal(r.vence, '2026-11-05');
  assert.equal(r.enFactura.length, 2);
  assert.equal(r.estimado, 102656 + 66779 + 31990);
  assert.equal(r.disponible, 156945);
  // 25 oct: ya cortó, se está pagando la factura del 19 oct
  assert.equal(resumenTarjeta(t, compras, '2026-10-25').corte, '2026-10-19');
  // 6 nov: ya se venció; la siguiente es la del 19 nov
  assert.equal(resumenTarjeta(t, compras, '2026-11-06').corte, '2026-11-19');
});

test('tarjeta: factura pagada pasa a la siguiente y el estimado no supera el saldo', async () => {
  const { resumenTarjeta } = await import('../public/js/motor.js');
  const t = { saldo: 300000, cupo: 800000, dia_corte: 19, dia_pago: 4, cuota_manejo: 0 };
  const compras = [
    { id: 1, fecha: '2026-10-02', monto: 100000, cuotas: 1, cuotas_pagadas: 0 },
    { id: 2, fecha: '2026-10-25', monto: 50000, cuotas: 1, cuotas_pagadas: 0 },
  ];
  const a = resumenTarjeta(t, compras, '2026-10-14');
  assert.equal(a.corte, '2026-10-19');
  assert.equal(a.estimado, 100000);
  const b = resumenTarjeta({ ...t, ultimo_corte_pagado: '2026-10-19' }, [{ ...compras[0], cuotas_pagadas: 1 }, compras[1]], '2026-10-14');
  assert.equal(b.corte, '2026-11-19');
  assert.equal(b.vence, '2026-12-04');
  assert.equal(b.estimado, 50000);
  assert.equal(resumenTarjeta({ ...t, saldo: 30000 }, compras, '2026-10-14').estimado, 30000);
});

test('proyección: última cuota igual a las demás, factura prevista y tarjeta liquidada sin intereses', async () => {
  const { proyectar } = await import('../public/js/motor.js');
  const base = { perfil: { salario_bruto: 3900000, dia_pago: 20 }, desde: '2026-10', meses: 12 };
  const cred = { id: 1, nombre: 'FEC', tipo: 'nomina', saldo: 888919, tasa_mensual: 0.012, cuota: 85750, cuotas_restantes: 11, mi_porcentaje: 100 };
  const h = proyectar({ ...base, deudas: [cred] }).deudas[0].historial;
  const pagos = h.filter((x) => x.pago > 0).map((x) => x.pago);
  assert.equal(pagos.length, 11);
  assert.ok(pagos.every((x) => Math.abs(x - 85750) <= 1), `pagos: ${pagos}`);
  const tj = { id: 2, nombre: 'CMR', tipo: 'tarjeta', saldo: 743055, tasa_mensual: 0.0185, cuota: 520000, mi_porcentaje: 100 };
  const t1 = proyectar({ ...base, deudas: [{ ...tj, pagos_previstos: { '2026-10': 555721 } }] }).deudas[0].historial;
  assert.equal(t1[0].pago, 555721);
  const t2 = proyectar({ ...base, deudas: [tj], parametros: { liquidar: [{ deuda_id: 2, periodo: '2026-10' }] } }).deudas[0].historial;
  assert.equal(t2[0].pago, 743055);
});

test('tarjeta con saldo sin detallar: la factura no baja de la cuota configurada', async () => {
  const { resumenTarjeta } = await import('../public/js/motor.js');
  const t = { saldo: 7000000, cuota: 800000, cupo: 9000000, dia_corte: 15, dia_pago: 5, cargos: [{ nombre: 'Manejo', valor: 45000 }] };
  assert.equal(resumenTarjeta(t, [], '2026-10-19').estimado, 800000);
  // con todo el saldo en compras, manda lo que dicen las compras
  const t2 = { ...t, saldo: 300000, cuota: 800000 };
  assert.equal(resumenTarjeta(t2, [{ id: 1, fecha: '2026-10-10', monto: 300000, cuotas: 6, cuotas_pagadas: 0 }], '2026-10-19').estimado, 95000);
});

test('nómina y proyección usan la cuota de cada crédito, no el saldo', () => {
  const deudas = [{ id: 1, nombre: 'FEC', tipo: 'nomina', saldo: 2574980, cuota: 229639, cuotas_restantes: 12, mi_porcentaje: 100, descuento_nomina: true },
    { id: 2, nombre: 'Tarjeta compartida', tipo: 'tarjeta', saldo: 7000000, cuota: 800000, tasa_mensual: 0.0185, mi_porcentaje: 65 }];
  const n = calcularNomina(perfil, { deudas });
  assert.deepEqual(n.creditosNomina.map((x) => x.monto), [229639]);
  const r = proyectar({ perfil, deudas, desde: '2026-10', meses: 2 });
  assert.equal(r.periodos[0].grupos.deudas[0].monto, 520000);
  assert.equal(r.periodos[0].grupos.ingresos[0].detalle[0].monto, 229639);
});
