// Modelo de Cálculos para Tarjetas de Crédito (Versión 2.0)
// Maneja estado de cuenta mensual, intereses y períodos de pago realistas

import { storage } from '/copcash/js/models/storage.js';

export class TarjetasCalculos {
  
  // ============ CÁLCULOS DEL PERÍODO ============
  
  /**
   * Calcula la suma de todas las cuotas vigentes del período actual
   */
  static calcularCuotasDelPeriodo(tarjeta) {
    return tarjeta.compras
      .filter(c => c.activa && c.cuotaActual <= c.cuotasTotal)
      .reduce((sum, compra) => sum + compra.monto_cuota_fija, 0);
  }

  /**
   * Calcula intereses sobre el saldo de períodos anteriores no pagados
   * Usa la fórmula: Interés = Saldo * (TEA/12) / 100
   */
  static calcularInteresesDelPeriodo(tarjeta) {
    if (tarjeta.saldoPeriodosAnteriores <= 0) return 0;
    
    const tasaMensual = tarjeta.tasaInteresAnual / 12;
    const interesMensual = tarjeta.saldoPeriodosAnteriores * (tasaMensual / 100);
    
    return Math.round(interesMensual * 100) / 100;
  }

  /**
   * Calcula el saldo total de la tarjeta en el período actual
   * = Cuotas del período + Saldo anterior no pagado + Intereses acumulados
   */
  static calcularSaldoTotalDelPeriodo(tarjeta) {
    const cuotas = this.calcularCuotasDelPeriodo(tarjeta);
    const saldoAnterior = tarjeta.saldoPeriodosAnteriores;
    const intereses = this.calcularInteresesDelPeriodo(tarjeta);
    
    return Math.round((cuotas + saldoAnterior + intereses) * 100) / 100;
  }

  /**
   * Calcula el saldo total adeudado incluyendo todas las cuotas vigentes
   * (usado para calcular uso del crédito)
   */
  static calcularSaldoTarjeta(tarjeta) {
    // Suma de todas las cuotas restantes de compras activas
    const cuotasRestantes = tarjeta.compras
      .filter(c => c.activa)
      .reduce((sum, compra) => {
        const cuotasAdeudadas = compra.cuotasTotal - compra.cuotasPagadas;
        return sum + (cuotasAdeudadas * compra.monto_cuota_fija);
      }, 0);
    
    return Math.round((cuotasRestantes + tarjeta.saldoPeriodosAnteriores + tarjeta.interesAcumulado) * 100) / 100;
  }

  /**
   * Calcula el límite disponible de la tarjeta
   */
  static calcularLimitDisponible(tarjeta) {
    const saldo = this.calcularSaldoTarjeta(tarjeta);
    return Math.round((tarjeta.limiteCrediticio - saldo) * 100) / 100;
  }

  /**
   * Calcula el porcentaje de utilización del crédito
   */
  static calcularPorcentajeUtilizacion(tarjeta) {
    const saldo = this.calcularSaldoTarjeta(tarjeta);
    return Math.round((saldo / tarjeta.limiteCrediticio) * 100);
  }

  /**
   * Calcula la próxima cuota a pagar (la cuota del período actual)
   * Esta es la cantidad que el usuario DEBE pagar y es OBLIGATORIA
   */
  static calcularProximaCuotaAPagar(tarjeta) {
    return this.calcularSaldoTotalDelPeriodo(tarjeta);
  }

  // ============ INFORMACIÓN DE FECHAS ============

  /**
   * Calcula la próxima fecha de cierre del período
   */
  static calcularProximaFechaCierre(tarjeta) {
    const hoy = new Date();
    const proximaCierre = new Date(hoy.getFullYear(), hoy.getMonth(), tarjeta.fechaCierre);
    
    // Si ya pasó el cierre este mes, la próxima es el próximo mes
    if (hoy > proximaCierre) {
      proximaCierre.setMonth(proximaCierre.getMonth() + 1);
    }
    
    return proximaCierre.toISOString().split('T')[0];
  }

  /**
   * Calcula la próxima fecha de pago del período actual
   */
  static calcularProximaFechaPago(tarjeta) {
    const hoy = new Date();
    let proximaPago = new Date(hoy.getFullYear(), hoy.getMonth(), tarjeta.fechaPago);
    
    // Si ya pasó el pago este mes, la próxima es el próximo mes
    if (hoy > proximaPago) {
      proximaPago.setMonth(proximaPago.getMonth() + 1);
    }
    
    return proximaPago.toISOString().split('T')[0];
  }

  /**
   * Calcula días faltantes para la fecha de pago
   */
  static calcularDiasParaPago(tarjeta) {
    const proximaPago = new Date(this.calcularProximaFechaPago(tarjeta));
    const hoy = new Date();
    const diferencia = proximaPago - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // ============ MANEJO DE COMPRAS A CUOTAS ============

  /**
   * Valida si una nueva compra cabe en el crédito disponible
   */
  static validarCompraDelimiteCrediticio(tarjeta, montoCompra) {
    const disponible = this.calcularLimitDisponible(tarjeta);
    return montoCompra <= disponible;
  }

  /**
   * Obtiene detalles de una compra específica
   */
  static obtenerDetallesCompra(tarjeta, compraId) {
    const compra = tarjeta.compras.find(c => c.id === compraId);
    if (!compra) return null;

    const cuotasRestantes = compra.cuotasTotal - compra.cuotasPagadas;
    const montoRestante = cuotasRestantes * compra.monto_cuota_fija;

    return {
      ...compra,
      cuotasRestantes,
      montoRestante,
      porcentajePagado: Math.round((compra.cuotasPagadas / compra.cuotasTotal) * 100)
    };
  }

  /**
   * Obtiene todas las compras activas con detalles expandidos
   */
  static obtenerComprasActivas(tarjeta) {
    return tarjeta.compras
      .filter(c => c.activa && (c.cuotasTotal - c.cuotasPagadas) > 0)
      .map(compra => this.obtenerDetallesCompra(tarjeta, compra.id));
  }

  // ============ MANEJO DE PAGOS ============

  /**
   * Registra un pago de la cuenta completa
   * Parámetros:
   *   monto: cantidad pagada
   *   tipoPago: "completo" | "parcial"
   * 
   * Si es completo: limpia el saldo del período, pasa cuotas del próximo mes
   * Si es parcial: reduce el saldo del período
   */
  static registrarPagoCuenta(tarjeta, monto, tipoPago = "completo") {
    const cuotaAPagar = this.calcularProximaCuotaAPagar(tarjeta);
    
    if (tipoPago === "completo" && monto < cuotaAPagar) {
      throw new Error(`Pago incompleto. Debe ser $${cuotaAPagar}, intentaste pagar $${monto}`);
    }

    // Incrementar cuota para la próxima vez (pasar al siguiente período)
    tarjeta.compras.forEach(compra => {
      if (compra.activa && compra.cuotaActual <= compra.cuotasTotal) {
        compra.cuotasPagadas = compra.cuotaActual;
        compra.cuotaActual += 1;
        
        // Si ya completó todas las cuotas, marcar como inactiva
        if (compra.cuotaActual > compra.cuotasTotal) {
          compra.activa = false;
        }
      }
    });

    // Registrar el pago
    if (!tarjeta.pagos_realizados) tarjeta.pagos_realizados = [];
    tarjeta.pagos_realizados.push({
      id: (tarjeta.pagos_realizados.length || 0) + 1,
      fecha_pago: new Date().toISOString().split('T')[0],
      monto_pagado: monto,
      es_monto_parcial: tipoPago === "parcial"
    });

    // Si pago completo, limpiar el saldo del período
    if (tipoPago === "completo") {
      tarjeta.saldoPeriodosAnteriores = 0;
      tarjeta.interesAcumulado = 0;
    } else {
      // Si pago parcial, el resto pasa como deuda anterior + intereses
      const diferencia = cuotaAPagar - monto;
      tarjeta.saldoPeriodosAnteriores = diferencia;
      tarjeta.interesAcumulado = 0; // Se recalculan en el siguiente período
    }

    return {
      exito: true,
      mensaje: tipoPago === "completo" ? "Cuenta pagada completamente" : "Pago parcial registrado",
      proximaCuota: this.calcularProximaCuotaAPagar(tarjeta)
    };
  }

  // ============ MÉTODOS LEGADOS (compatibilidad) ============

  static calcularValorCuota(compra) {
    return compra.monto_cuota_fija || Math.round((compra.montoTotal / compra.cuotasTotal) * 100) / 100;
  }

  static calcularMontoRestante(compra) {
    const valorCuota = this.calcularValorCuota(compra);
    const cuotasRestantes = compra.cuotasTotal - compra.cuotasPagadas;
    return Math.round(cuotasRestantes * valorCuota * 100) / 100;
  }

  static calcularCuotasRestantes(compra) {
    return compra.cuotasTotal - compra.cuotasPagadas;
  }

  static calcularPagaMensualTarjeta(tarjeta) {
    return this.calcularProximaCuotaAPagar(tarjeta);
  }

  static marcarCuotaPagada(tarjeta, compraId) {
    // Método deprecado - ahora se usa registrarPagoCuenta
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
