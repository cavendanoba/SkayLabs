# 💳 Refactorización Sistema de Tarjetas de Crédito v2.0

## 📋 Resumen de Cambios

Se implementó un sistema profesional de tarjetas de crédito basado en patrones de aplicaciones reales (Nubank, Mono, N26). Los cambios eliminan el modelo de "pagar cuota individual" por un modelo realista de **"estado de cuenta mensual"** con cálculo automático de intereses.

---

## 🔄 Cambios Principales

### 1. **Nuevo Modelo de Datos (seedData.js)**

#### ✅ Campos Agregados a Tarjeta:
```javascript
{
  id: 1,
  nombre: "Visa Oro",
  banco: "Banco Popular",
  limiteCrediticio: 5000,
  
  // 🆕 NUEVO: Tasa de interés anual
  tasaInteresAnual: 19.32,      // TEA en porcentaje
  tasaInteresAnual: 19.32,      // Típico: 18-25% en Colombia
  
  // 🆕 NUEVO: Parámetros de período
  fechaCierre: 20,              // Día en que cierra el período
  fechaPago: 25,                // Día vencimiento (5 días después)
  
  // 🆕 NUEVO: Control de deuda y intereses
  saldoPeriodosAnteriores: 0,   // Deuda acumulada de meses pasados
  interesAcumulado: 0,          // Intereses no pagados
  
  // Compras a cuotas (sin cambios en estructura, pero con campos nuevos)
  compras: [
    {
      id: 1,
      nombre: "Laptop Dell",
      montoTotal: 1200,
      cuotasTotal: 6,
      cuotasPagadas: 2,
      cuotaActual: 3,           // 🆕 Cuota en la que estamos
      monto_cuota_fija: 200,    // 🆕 $1200/6 = $200
      fechaPrimeraCompra: "2026-03-15",
      activa: true              // 🆕 Se marca false cuando se completa
    }
  ],
  
  // 🆕 NUEVO: Historial de pagos
  pagos_realizados: [
    {
      id: 1,
      fecha_pago: "2026-02-25",
      monto_pagado: 500,
      es_monto_parcial: false
    }
  ]
}
```

#### ➖ Campos Eliminados:
- ❌ `saldoDisponible` (Se calcula automáticamente ahora)

---

### 2. **Nuevos Métodos de Cálculo (TarjetasCalculos)**

#### Períodos y Cuotas:
```javascript
// Suma de todas las cuotas del período actual
calcularCuotasDelPeriodo(tarjeta)
// Ej: Laptop $200 + Muebles $200 = $400/mes

// Intereses sobre deuda anterior
calcularInteresesDelPeriodo(tarjeta)
// Fórmula: Deuda × (TEA/12) / 100

// Cuota total a pagar (cuotas + intereses)
calcularSaldoTotalDelPeriodo(tarjeta)
// Ej: $400 cuotas + $0 de interés = $400 a pagar

// Próxima cuota (la obligatoria)
calcularProximaCuotaAPagar(tarjeta)
```

#### Fechas y Urgencia:
```javascript
// Próxima fecha de cierre del período
calcularProximaFechaCierre(tarjeta)     // Ej: 20-abr-2026

// Próxima fecha de pago (vencimiento)
calcularProximaFechaPago(tarjeta)       // Ej: 25-abr-2026

// Cuántos días quedan para pagar
calcularDiasParaPago(tarjeta)           // Ej: 5 días
```

#### Límites de Crédito:
```javascript
// Porcentaje de uso del crédito
calcularPorcentajeUtilizacion(tarjeta)  // Ej: 45%

// Crédito disponible
calcularLimitDisponible(tarjeta)        // Ej: $2750
```

#### Gestión de Pagos:
```javascript
// Registra pago completo (limpia el período)
registrarPagoCuenta(tarjeta, monto, "completo")

// Registra pago parcial (acumula intereses)
registrarPagoCuenta(tarjeta, monto, "parcial")
```

---

### 3. **Nueva Vista (tarjetasView.js)**

#### Cambios de UX:

**ANTES:** "Pagar cuota" individual por cada compra
```
[Laptop] Pagar cuota → Muebles [Pagar cuota]
```

**AHORA:** "Pagar cuenta completa" para todo el período
```
┌─────────────────────────────────────┐
│  CUOTA A PAGAR (Estado de Cuenta)   │
│  $400 COP                           │
│  Fecha Pago: 25 abr 2026           │
│  Días para pagar: 5                │
│  [✓ PAGAR CUENTA COMPLETA]         │  ← Botón principal
│  [💳 Pago Parcial]                 │
└─────────────────────────────────────┘
```

#### Nuevas Secciones en Vista:

1. **Resumen de Cuenta (Hero card)**
   - Cuota total a pagar
   - Fecha de pago
   - Días restantes con color de urgencia:
     - 🔴 Rojo: ≤3 días (urgente)
     - 🟠 Naranja: 4-7 días
     - 🟢 Verde: >7 días

2. **KPI Grid (4 columnas)**
   - % Uso del crédito (con barra visual)
   - Disponible
   - Saldo total
   - Límite total

3. **Alerta de Intereses** (solo si hay deuda anterior)
   - Deuda anterior
   - Interés generado
   - Total a pagar con interés

4. **Desglose de Compras**
   - Cada compra a cuotas
   - Cuota actual / Total de cuotas
   - Monto restante
   - Barra de progreso

5. **Información de Fechas**
   - Próximo cierre
   - Vencimiento
   - TEA

---

### 4. **Event Listeners Actualizados (router.js)**

#### ✅ NUEVO: Botones de Pago

```javascript
// Pagar cuenta completa
.btn-pagar-cuenta
// Requiere pago del 100% de la cuota
// Incrementa cuota_actual para la próxima compra
// Limpia deuda de períodos anteriores

// Pago parcial
.btn-pagar-parcial
// Permite pagar menos que la cuota obligatoria
// Acumula diferencia como "saldoPeriodosAnteriores"
// ⚠️ Genera intereses en el siguiente período
```

#### ❌ ELIMINADO: Botón "Pagar cuota"
- Ya no hay botón para pagar cuota individual
- **Todo pago debe ser de la cuenta completa**

---

## 💡 Cómo Funciona el Nuevo Sistema

### Escenario 1: Pago Completo ✓
```
Período Actual:
- Laptop: Cuota 3 de 6 = $200
- Muebles: Cuota 2 de 4 = $200
- Total a pagar: $400

Usuario paga $400 completo
↓
- Laptop pasa a Cuota 4
- Muebles pasa a Cuota 3
- Sin intereses
```

### Escenario 2: Pago Parcial (Genera Intereses) ⚠️
```
Período Actual:
- Total a pagar: $400

Usuario paga solo $300
↓
- Deuda no pagada: $100
- Próximo período:
  - Se calcula interés: $100 × (19.32%/12) = $1.61
  - Nueva cuota: $400 + $1.61 = $401.61
```

### Cálculo de Intereses
```
Fórmula: (Deuda No Pagada) × (TEA / 12) / 100

Ejemplo con TEA 19.32%:
Deuda: $100
Interés mensual: $100 × (19.32 / 12) / 100 = $1.61
```

---

## 🎨 Material Design 3 Updates

- ✓ Hero card con gradiente azul (cuota principal)
- ✓ Colores de urgencia según días para pagar
- ✓ Barra de progreso de uso del crédito
- ✓ Cards con elevación y sombras
- ✓ Alertas de intereses destacadas
- ✓ Botones prominentes para acciones principales
- ✓ Soporte completo para dark mode

---

## 📝 Parámetros a Solicitar en Nueva Tarjeta

```
✓ Nombre (Ej: Visa Oro)
✓ Banco (Ej: Banco Popular)
✓ Límite de Crédito (Ej: 5000)
✓ Tasa de Interés Anual TEA % (Ej: 19.32)  ← NUEVO
✓ Día de Cierre (Ej: 20)
✓ Día de Pago (Ej: 25)
```

---

## 🔧 Compatibilidad

- ✓ Métodos antiguos preservados (calcularValorCuota, etc.)
- ✓ Compras a cuotas mantienen estructura compatible
- ✓ Sin cambios en storage.js (compatible hacia atrás)
- ✓ Sin cambios en dashboard.js

---

## 📚 Referencia Aplicaciones Profesionales

Basado en patrones de:
- **Nubank** (Brasil)
- **Mono** (Colombia)
- **N26** (Internacional)
- **YNAB** (You Need A Budget)

Características implementadas:
- Estado de cuenta mensual
- Cálculo automático de intereses
- Pago de cuenta completa
- Historial de pagos
- Alertas por vencimiento

---

## ⚡ Próximas Mejoras (Optional)

- [ ] Simulador de cuotas (sin intereses vs con intereses)
- [ ] Gráfico de intereses acumulados en el tiempo
- [ ] Alertas de pago por email/notificación
- [ ] Exportar estado de cuenta a PDF
- [ ] Vinculación con calendario (Google Calendar)
- [ ] Presupuesto máximo por categoría en tarjeta
- [ ] Comparativa de TEA entre tarjetas

---

**Versión:** 2.0  
**Fecha:** Marzo 2026  
**Diseño:** Material Design 3  
**Modelo:** Estado de Cuenta Mensual con Intereses Automáticos
