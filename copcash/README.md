# Organizador de Nómina Personal Avanzado

## Descripción
Aplicación web completa para gestión de nómina personal con módulos de tarjetas de crédito, metas de ahorro y flujo de caja proyectado. Implementado con arquitectura MVC simplificada usando JavaScript ES modules.

## Estructura MVC Simplificada

```
copcash/
├── index.html                 # Punto de entrada (estructura HTML + Tailwind)
├── js/
│   ├── app.js                 # Inicialización principal
│   ├── model.js               # Modelo (datos, CRUD, localStorage)
│   ├── view.js                # Vista (renderizado dinámico del DOM)
│   ├── controller.js          # Controlador (event listeners, lógica)
│   ├── calculators.js         # Cálculos financieros complejos
│   └── utils.js               # Utilidades reutilizables
└── README.md                  # Este archivo
```

## Componentes

### Model (model.js)
- Gestión de datos en localStorage
- CRUD completo para: gastos fijos, variables, ingresos, tarjetas, compras, metas
- Métodos de negocio: `addFixedExpense()`, `addCreditCard()`, `addSavingsGoal()`, etc.
- Persistencia automática en localStorage

### View (view.js)
- Renderizado dinámico de todas las secciones
- Métodos: `renderDashboard()`, `renderCards()`, `renderCashFlow()`, etc.
- Generación de gráficos (Canvas) para distribución de gastos
- Actualización reactiva del DOM

### Controller (controller.js)
- Event listeners para todas las interacciones
- Validación de formularios
- Coordinación entre Model y View
- Manejo de tema oscuro/claro
- Exportar e importar datos JSON

### Calculators (calculators.js)
- Cálculos de cuotas de tarjeta (valor, restantes, monto)
- Saldo disponible de tarjeta
- Dinero libre y dinero libre real
- Generación de flujo de caja proyectado (30-60 días)
- Estimaciones mensuales de aportes a metas

### Utils (utils.js)
- Generación de IDs únicos
- Conversión de números y moneda
- Manejo de fechas (ISO, mes-año)
- Escapado HTML para seguridad

### App (app.js)
- Inicialización en DOMContentLoaded
- Orquestación de Model, View y Controller

## Características Principales

### 1. Nómina
- Salario neto mensual con día de cobro configurable
- Cálculo de dinero libre (salario - gastos fijos - ingresos extra)

### 2. Gastos Fijos
- CRUD de gastos recurrentes por día del mes
- Categorización
- Presupuesto mensual por categoría

### 3. Gastos Variables
- CRUD de gastos puntuales con fecha
- Estado pagado/no pagado
- Impacto en flujo de caja solo si están pagados

### 4. Tarjetas de Crédito
- Registro de múltiples tarjetas (nombre, banco, cierre, pago, límite)
- Compras en cuotas con:
  - Cálculo automático de valor por cuota
  - Seguimiento de cuotas pagadas/restantes
  - Actualización automática del saldo
- Pago de cuotas individuales
- Proyección de pagos mensuales

### 5. Metas de Ahorro
- Crear metas con objetivo y cantidad actual
- Fecha objetivo + cálculo de aporte sugerido mensual
- Aportes automáticos o manuales
- Barra de progreso visual

### 6. Flujo de Caja Proyectado
- Proyección de 30, 45 o 60 días
- Evento por evento: salary, gastos fijos, variables, extras, tarjetas, metas
- Vista diaria con saldo de cierre
- Edición/eliminación de eventos mediante overrides
- Alerta si hay saldo negativo proyectado

### 7. Dashboard
- Resumen de dinero libre (base y real)
- Total de tarjetas a pagar este mes
- Progreso de metas destacadas
- Gráfico circular de distribución de gastos
- Alerta de riesgo financiero

### 8. Categorías Personalizables
- CRUD de categorías (gasto, ingreso, ahorro)
- Presupuesto mensual por categoría
- Alertas si se supera presupuesto

## Requisitos Técnicos

- ES Modules (imports/exports)
- Tailwind CSS (CDN)
- LocalStorage API
- Canvas API (gráficos)
- Intl.NumberFormat (formato de moneda)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## Instalación y Uso

1. Abre `/copcash/index.html` en tu navegador
2. Los datos se cargan automáticamente de localStorage o se inicializan con datos de ejemplo
3. Navega entre secciones usando el navbar
4. Exporta/importa datos JSON usando los botones en la esquina superior

## Ejemplo de Uso

1. **Configurar nómina**: Ve a Configuración > ingresa salario y día de cobro
2. **Crear gastos fijos**: Gastos fijos > agrega Alquiler, Internet, etc.
3. **Registrar tarjeta**: Tarjetas > agrega Visa > luego agrega compras en cuotas
4. **Pagar cuota**: Tarjetas > botón "Pagar cuota" > se recalcula automáticamente
5. **Crear meta**: Metas > agrega Viaje a la playa > contribuciones automáticas o manuales
6. **Ver flujo**: Flujo de caja > consulta proyección diaria por 60 días

## Persistencia de Datos

Todos los datos se guardan automáticamente en: `localStorage["advancedPayrollOrganizerData_v1"]`

Puedes exportar a JSON para backup y reimportar en el futuro.

## Próximas Mejoras (Opcionales)

- Edición completa de cada registro (no solo crear/eliminar)
- Filtros avanzados y búsqueda global
- Reportes más complejos (PDF)
- Sincronización en la nube
- Notificaciones de eventos próximos
- Histórico de cambios

---

**Nota**: La aplicación está completamente autocontenida en la carpeta `copcash/`. No requiere build step ni servidor de desarrollo; funciona con un simple servidor estático (Python, Node, Live Server, etc.).
