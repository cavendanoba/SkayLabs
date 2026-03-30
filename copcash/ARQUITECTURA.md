# Arquitectura MVC - Diagrama de Flujo

## Relación de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                  index.html (SPA)                       │
│          (estructura, Tailwind, puntos de entrada)      │
└──────────────────────────┬────────────────────────────────┘
                           │
                    es-module imports
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐          ┌──▼──┐          ┌────▼───┐
    │  View  │          │Model│          │ Controller
    │        │          │     │          │
    └────┬───┘          └──┬──┘          └─────┬──┘
         │                 │                    │
         │ Lee datos       │ Persiste           │ Valida
         │                 │                    │
         └─────────────────┼────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ localStorage │
                    └──────────────┘
```

## Flujo de Datos - Ejemplo: Agregar Gasto Fijo

```
1. Usuario clic en "Agregar" (formulario de gasto fijo)
   ↓
2. Controller.handleFixedSubmit() captura evento
   ↓
3. Valida datos (monto > 0, nombre no vacío)
   ↓
4. Model.addFixedExpense() agrega a this.data.fixedExpenses[]
   ↓
5. Model.save() persiste en localStorage
   ↓
6. View.renderAll() redibujaDOM con nuevos datos
   ↓
7. Usuario ve el gasto en la tabla
```

## Flujo de Datos - Ejemplo: Pagar Cuota de Tarjeta

```
1. Usuario clic "Pagar cuota" (en tabla de compras)
   ↓
2. Controller.handlerClick() identifica acción "pay-installment"
   ↓
3. Model.payInstallment(cardId, purchaseId)
   → Incrementa purchase.paidInstallments
   → Vuelve a guardar en localStorage
   ↓
4. Calculators recalculan automáticamente:
   - remainingInstallments()
   - remainingAmount()
   - cardMonthlyPayment()
   ↓
5. View re-renderiza:
   - Dashboard (dinero libre real cambia)
   - Tabla de tarjetas (saldo y total mes actualizan)
   - Flujo de caja (proyección recalculada)
   ↓
6. Usuario ve cambios en tiempo real
```

## Flujo de Datos - Ejemplo: Ver Flujo de Caja

```
1. Usuario navega a "Flujo de caja"
   ↓
2. View.showView("cashflow")
   ↓
3. View.renderCashFlow() llama a:
   Calculators.generateCashFlow(60)
   ↓
4. generateCashFlow() integra todos los eventos:
   - Salarios (configuración + día)
   - Gastos fijos (recurrentes)
   - Gastos variables (si pagados = true)
   - Ingresos extra (en sus fechas)
   - Compras de tarjeta (según cuotas pendientes)
   - Aportes a metas (automáticos)
   - Ajustes manuales
   - Event Overrides (ediciones)
   ↓
5. Calcula balance acumulado para cada día
   ↓
6. Genera vista diaria (sin movimiento destacado)
   ↓
7. Renderiza dos tablas:
   - Tabla de eventos (editable)
   - Tabla de calendario diario (saldo cierre)
   ↓
8. Usuario ve proyección completa con alertas
```

## Dependencias entre Módulos

```
app.js
 ├─ Model
 ├─ View
 │   ├─ Utils
 │   ├─ Model (lectura)
 │   └─ Calculators
 │       ├─ Utils
 │       ├─ Model (lectura)
 └─ Controller
     ├─ Utils
     ├─ Model (lectura/escritura)
     └─ View (renderizado)
```

## Patrones de Interacción

### 1. Create (Crear Registro)
```
Usuario → Form → Controller → Model.add*() → save() → View.render*()
```

### 2. Read (Leer/Calcular)
```
Model.data[] → Calculators.calculate*() → View.render*()
```

### 3. Update (Actualizar)
```
Usuario → Action → Model.edit*() o Model.toggle*() → save() → View.render*()
```

### 4. Delete (Eliminar)
```
Usuario → Botón Delete → Controller → Model.delete*() → save() → View.render*()
```

## Sincronización de Vistas

Después de cualquier cambio de datos:
```
Model.save() → View.renderAll()
```

Esto asegura que:
- Dashboard se actualiza con nuevos cálculos
- Tablas muestran datos frescos
- Gráficos se recalculan
- Alertas se actualizanautomáticamente
- Flujo de caja refleja todos los cambios

## LocalStorage Schema

```json
{
  "advancedPayrollOrganizerData_v1": {
    "settings": { "salaryAmount", "salaryDay", "baseBalance", "theme", "flowDays" },
    "categories": [ { "id", "name", "type", "monthlyBudget" } ],
    "fixedExpenses": [ { "id", "name", "amount", "categoryId", "dueDay" } ],
    "variableExpenses": [ { "id", "name", "amount", "date", "categoryId", "paid" } ],
    "extraIncomes": [ { "id", "name", "amount", "date", "categoryId" } ],
    "creditCards": [
      {
        "id", "name", "bank", "closingDay", "paymentDay", "limit",
        "purchases": [ { "id", "name", "totalAmount", "totalInstallments", "paidInstallments", "firstInstallmentDate" } ]
      }
    ],
    "savingsGoals": [ { "id", "name", "targetAmount", "currentAmount", "targetDate", "monthlyContribution", "autoContribution" } ],
    "goalContributions": [ { "id", "goalId", "amount", "date", "type" } ],
    "cashFlowAdjustments": [ { "id", "date", "description", "amount", "type" } ],
    "eventOverrides": [ { "eventId", "date", "amount", "description", "deleted" } ]
  }
}
```

---

**Key Insight**: Todo fluye centralizadamente a través del Modelo. La Vista siempre es derivada del estado del Modelo. El Controlador es el único que modifica el Modelo.
