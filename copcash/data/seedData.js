// Datos de ejemplo para la primera carga
export const seedData = {
  salario: {
    monto: 3000,
    diaCobro: 5,
    descripcion: "Salario base mensual"
  },
  categorias: [
    { id: 1, nombre: "Alimentación", icon: "🍔", presupuesto: 500, color: "#FF6B6B" },
    { id: 2, nombre: "Transporte", icon: "🚗", presupuesto: 300, color: "#4ECDC4" },
    { id: 3, nombre: "Servicios", icon: "💡", presupuesto: 400, color: "#45B7D1" },
    { id: 4, nombre: "Entretenimiento", icon: "🎬", presupuesto: 200, color: "#F7B731" },
    { id: 5, nombre: "Salud", icon: "⚕️", presupuesto: 250, color: "#5F27CD" },
    { id: 6, nombre: "Otros", icon: "📌", presupuesto: 350, color: "#A4B0BD" }
  ],
  gastosFijos: [
    {
      id: 1,
      nombre: "Arriendo",
      monto: 1200,
      categoria: 3,
      diaVencimiento: 1,
      activo: true
    },
    {
      id: 2,
      nombre: "Internet",
      monto: 80,
      categoria: 3,
      diaVencimiento: 10,
      activo: true
    }
  ],
  gastosVariables: [
    {
      id: 1,
      nombre: "Compra en supermercado",
      monto: 150,
      fecha: new Date().toISOString().split('T')[0],
      categoria: 1,
      pagado: true
    },
    {
      id: 2,
      nombre: "Cine y palomitas",
      monto: 35,
      fecha: new Date().toISOString().split('T')[0],
      categoria: 4,
      pagado: false
    }
  ],
  ingresosExtra: [
    {
      id: 1,
      nombre: "Freelance - Proyecto web",
      monto: 500,
      fecha: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      categoria: 1,
      completado: false
    }
  ],
  tarjetas: [
    {
      id: 1,
      nombre: "Visa Oro",
      banco: "Banco Popular",
      limiteCrediticio: 5000,
      tasaInteresAnual: 19.32,  // TEA (%) - típico para Colombia
      fechaCierre: 20,          // Día en que se cierra el período
      fechaPago: 25,            // Día límite de pago (5 días después del cierre)
      saldoPeriodosAnteriores: 0,    // Deuda no pagada de períodos anteriores (acumula intereses)
      interesAcumulado: 0,            // Intereses a pagar del saldo anterior
      
      // Compras activas a cuotas - detallan qué se financió
      compras: [
        {
          id: 1,
          nombre: "Laptop Dell",
          montoTotal: 1200,
          cuotasTotal: 6,
          cuotasPagadas: 2,
          cuotaActual: 3,           // En qué cuota estamos
          monto_cuota_fija: 200,    // $1200/6 = $200 por cuota
          fechaPrimeraCompra: new Date().toISOString().split('T')[0],
          activa: true
        },
        {
          id: 2,
          nombre: "Muebles sala",
          montoTotal: 800,
          cuotasTotal: 4,
          cuotasPagadas: 1,
          cuotaActual: 2,
          monto_cuota_fija: 200,    // $800/4 = $200 por cuota
          fechaPrimeraCompra: new Date().toISOString().split('T')[0],
          activa: true
        }
      ],
      
      // Registro de pagos anteriores (para historial)
      pagos_realizados: [
        {
          id: 1,
          fecha_pago: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          monto_pagado: 500,
          esmontoParcial: false
        }
      ]
    }
  ],
  metas: [
    {
      id: 1,
      nombre: "Viaje a la playa",
      montoObjetivo: 1000,
      montoActual: 250,
      fechaObjetivo: new Date(new Date().getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aporteAutomatico: false,
      aporteAutomaticoMonto: 0
    },
    {
      id: 2,
      nombre: "Fondo de emergencia",
      montoObjetivo: 5000,
      montoActual: 1500,
      fechaObjetivo: null,
      aporteAutomatico: true,
      aporteAutomaticoMonto: 200
    }
  ]
};
