// Modelo de Cálculos para Tarjetas de Crédito
// Maneja la lógica de cuotas y montos

import { storage } from './storage.js';

export class TarjetasCalculos {
  static calcularValorCuota(compra) {
    return Math.round((compra.montoTotal / compra.cuotasTotal) * 100) / 100;
  }

  static calcularMontoRestante(compra) {
    const valorCuota = this.calcularValorCuota(compra);
    const cuotasRestantes = compra.cuotasTotal - compra.cuotasPagadas;
    return Math.round(cuotasRestantes * valorCuota * 100) / 100;
  }

  static calcularCuotasRestantes(compra) {
    return compra.cuotasTotal - compra.cuotasPagadas;
  }

  static calcularSaldoTarjeta(tarjeta) {
    const totalCompras = tarjeta.compras.reduce((sum, compra) => {
      return sum + this.calcularMontoRestante(compra);
    }, 0);
    return Math.round(totalCompras * 100) / 100;
  }

  static calcularLimitDisponible(tarjeta) {
    const saldo = this.calcularSaldoTarjeta(tarjeta);
    return Math.round((tarjeta.limiteCrediticio - saldo) * 100) / 100;
  }

  static calcularPagaMensualTarjeta(tarjeta) {
    const valorPorCompra = tarjeta.compras
      .filter(compra => this.calcularCuotasRestantes(compra) > 0)
      .reduce((sum, compra) => sum + this.calcularValorCuota(compra), 0);
    return Math.round(valorPorCompra * 100) / 100;
  }

  static marcarCuotaPagada(tarjeta, compraId) {
    const compra = tarjeta.compras.find(c => c.id === compraId);
    if (compra && compra.cuotasPagadas < compra.cuotasTotal) {
      compra.cuotasPagadas += 1;
      return true;
    }
    return false;
  }
}

export class IngresosGastosCalculos {
  static calcularTotalGastosFijos() {
    return storage.getGastosFijos().reduce((sum, gasto) => sum + gasto.monto, 0);
  }

  static calcularTotalGastosVariables() {
    return storage.getGastosVariables()
      .filter(gasto => gasto.pagado)
      .reduce((sum, gasto) => sum + gasto.monto, 0);
  }

  static calcularTotalIngresosExtra() {
    return storage.getIngresosExtra().reduce((sum, ingreso) => sum + ingreso.monto, 0);
  }

  static calcularDineroLibre() {
    const salario = storage.getSalario().monto;
    const gastosFijos = this.calcularTotalGastosFijos();
    const gastosVariables = this.calcularTotalGastosVariables();
    
    // Calcular total de tarjetas del mes actual
    let totalTarjetas = 0;
    storage.getTarjetas().forEach(tarjeta => {
      totalTarjetas += TarjetasCalculos.calcularPagaMensualTarjeta(tarjeta);
    });

    // Calcular aportes automáticos a metas
    let aportesAutoMetas = 0;
    storage.getMetas().forEach(meta => {
      if (meta.aporteAutomatico) {
        aportesAutoMetas += meta.aporteAutomaticoMonto;
      }
    });

    return Math.round((salario - gastosFijos - gastosVariables - totalTarjetas - aportesAutoMetas) * 100) / 100;
  }

  static calcularGastosPorCategoria() {
    const categorias = {};
    storage.getCategorias().forEach(cat => {
      categorias[cat.id] = { nombre: cat.nombre, total: 0, presupuesto: cat.presupuesto, icon: cat.icon };
    });

    storage.getGastosFijos().forEach(gasto => {
      if (categorias[gasto.categoria]) {
        categorias[gasto.categoria].total += gasto.monto;
      }
    });

    storage.getGastosVariables().forEach(gasto => {
      if (gasto.pagado && categorias[gasto.categoria]) {
        categorias[gasto.categoria].total += gasto.monto;
      }
    });

    return categorias;
  }

  static verificarAlertasPresupuesto() {
    const gastosPorCat = this.calcularGastosPorCategoria();
    const alertas = [];

    Object.entries(gastosPorCat).forEach(([catId, datos]) => {
      if (datos.total > datos.presupuesto) {
        alertas.push({
          categoria: datos.nombre,
          gasto: datos.total,
          presupuesto: datos.presupuesto,
          exceso: Math.round((datos.total - datos.presupuesto) * 100) / 100
        });
      }
    });

    return alertas;
  }
}

export class MetasCalculos {
  static calcularPorcentajeAlcanzado(meta) {
    return meta.montoObjetivo > 0 
      ? Math.round((meta.montoActual / meta.montoObjetivo) * 100)
      : 0;
  }

  static calcularMontoRestante(meta) {
    return Math.round((meta.montoObjetivo - meta.montoActual) * 100) / 100;
  }

  static calcularAhorroMensualRequerido(meta) {
    if (!meta.fechaObjetivo) return 0;
    
    const hoy = new Date();
    const objetivo = new Date(meta.fechaObjetivo);
    const mesesRestantes = (objetivo.getFullYear() - hoy.getFullYear()) * 12 + 
                           (objetivo.getMonth() - hoy.getMonth());
    
    if (mesesRestantes <= 0) return 0;
    
    const montoRestante = this.calcularMontoRestante(meta);
    return Math.round((montoRestante / mesesRestantes) * 100) / 100;
  }
}

export class FlujoCalculos {
  static calcularSaldoEnDia(dias) {
    const salario = storage.getSalario();
    let saldo = 0;
    
    dias.forEach((dia, index) => {
      // Sumar ingresos
      dia.eventos?.forEach(evento => {
        if (evento.tipo === 'ingreso') {
          saldo += evento.monto;
        } else if (evento.tipo === 'egreso') {
          saldo -= evento.monto;
        }
      });
    });

    return saldo;
  }

  static generarFlujoCaja(diasAdelante = 60) {
    const dias = [];
    const hoy = new Date();
    const salario = storage.getSalario();
    let saldoAcumulado = 0;

    for (let i = 0; i < diasAdelante; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const diaDelMes = fecha.getDate();

      const dia = {
        fecha: fechaStr,
        diaDelMes: diaDelMes,
        eventos: [],
        saldoFinal: saldoAcumulado
      };

      // Agregar salario
      if (diaDelMes === salario.diaCobro) {
        dia.eventos.push({
          tipo: 'ingreso',
          descripcion: 'Salario ' + salario.descripcion,
          monto: salario.monto,
          categoria: 'Salario'
        });
        saldoAcumulado += salario.monto;
      }

      // Agregar gastos fijos
      storage.getGastosFijos().forEach(gasto => {
        if (diaDelMes === gasto.diaVencimiento && gasto.activo) {
          dia.eventos.push({
            tipo: 'egreso',
            descripcion: gasto.nombre,
            monto: gasto.monto,
            categoria: storage.getCategoria(gasto.categoria)?.nombre
          });
          saldoAcumulado -= gasto.monto;
        }
      });

      // Agregar gastos variables pagados
      storage.getGastosVariables().forEach(gasto => {
        if (gasto.pagado && gasto.fecha === fechaStr) {
          dia.eventos.push({
            tipo: 'egreso',
            descripcion: gasto.nombre,
            monto: gasto.monto,
            categoria: storage.getCategoria(gasto.categoria)?.nombre
          });
          saldoAcumulado -= gasto.monto;
        }
      });

      // Agregar ingresos extra
      storage.getIngresosExtra().forEach(ingreso => {
        if (ingreso.fecha === fechaStr) {
          dia.eventos.push({
            tipo: 'ingreso',
            descripcion: ingreso.nombre,
            monto: ingreso.monto,
            categoria: storage.getCategoria(ingreso.categoria)?.nombre
          });
          saldoAcumulado += ingreso.monto;
        }
      });

      // Agregar pagos de tarjetas
      const primerDiaDelMes = diaDelMes === 1;
      if (primerDiaDelMes) {
        storage.getTarjetas().forEach(tarjeta => {
          const totalPagar = TarjetasCalculos.calcularPagaMensualTarjeta(tarjeta);
          if (totalPagar > 0) {
            dia.eventos.push({
              tipo: 'egreso',
              descripcion: 'Pago tarjeta ' + tarjeta.nombre,
              monto: totalPagar,
              categoria: 'Tarjeta de Crédito'
            });
            saldoAcumulado -= totalPagar;
          }
        });
      }

      // Agregar aportes automáticos a metas
      if (primerDiaDelMes) {
        storage.getMetas().forEach(meta => {
          if (meta.aporteAutomatico && meta.aporteAutomaticoMonto > 0) {
            dia.eventos.push({
              tipo: 'egreso',
              descripcion: 'Aporte a meta: ' + meta.nombre,
              monto: meta.aporteAutomaticoMonto,
              categoria: 'Meta de Ahorro'
            });
            saldoAcumulado -= meta.aporteAutomaticoMonto;
          }
        });
      }

      dia.saldoFinal = Math.round(saldoAcumulado * 100) / 100;
      dias.push(dia);
    }

    return dias;
  }

  static verificarAlertasSaldoNegativo(flujoCaja) {
    return flujoCaja
      .filter(dia => dia.saldoFinal < 0)
      .map(dia => ({
        fecha: dia.fecha,
        saldo: dia.saldoFinal
      }));
  }
}
