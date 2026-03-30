# 💰 CopCash - Organizador de Nómina Personal Avanzado

## 📋 Descripción

**CopCash** es una aplicación web completa de gestión financiera personal diseñada como una **SPA (Single Page Application)** con arquitectura **MVC simplificada**. Permite a los usuarios organizar su nómina, gestionar gastos, crear metas de ahorro, administrar tarjetas de crédito con sistema de cuotas y proyectar el flujo de caja.

## 🏗️ Arquitectura

La aplicación sigue un patrón **MVC (Modelo-Vista-Controlador) simplificado**:

### Estructura de Carpetas

```
copcash/
├── index.html                      # Shell HTML principal (SPA)
├── css/
│   └── styles.css                  # Estilos personalizados
├── data/
│   └── seedData.js                 # Datos de ejemplo inicial
└── js/
    ├── app.js                      # Punto de entrada de la aplicación
    ├── models/
    │   ├── storage.js              # Modelo de persistencia (localStorage)
    │   └── calculos.js             # Lógica de cálculos complejos
    ├── views/
    │   ├── dashboardView.js        # Vista del Dashboard
    │   ├── gastosView.js           # Vistas de Gastos (Fijos y Variables)
    │   ├── ingresosView.js         # Vista de Ingresos Extra
    │   ├── tarjetasView.js         # Vista de Tarjetas de Crédito
    │   ├── metasView.js            # Vista de Metas de Ahorro
    │   ├── flujoView.js            # Vista del Flujo de Caja Proyectado
    │   ├── categoriasView.js       # Vista de Categorías y Presupuestos
    │   └── navbarView.js           # Vistas del Navbar y Configuración
    └── controllers/
        └── router.js               # Controlador principal y Router SPA
```

## 🏛️ Componentes

### 1. **Modelo (Models)**

**storage.js**: Maneja toda la persistencia de datos en localStorage y ejecuta operaciones CRUD.
- `StorageModel`: Clase central que gestiona sincronización de datos
- Métodos para CRUD de todas las entidades

**calculos.js**: Lógica de cálculos complejos separada del modelo de almacenamiento.
- `TarjetasCalculos`: Cálculos de cuotas, saldos y pagos mensuales
- `IngresosGastosCalculos`: Totales, dinero libre, alertas de presupuesto
- `MetasCalculos`: Progreso, montos restantes, plazos
- `FlujoCalculos`: Proyección diaria del flujo de caja

### 2. **Vistas (Views)**

Cada vista es responsable de renderizar componentes HTML sin lógica de negocio.
- `DashboardView`: Resumen general con KPIs principales
- `GastosFijosView` / `GastosVariablesView`: Gestión de gastos
- `IngresosExtraView`: Gestión de ingresos extras
- `TarjetasView`: Tarjetas de crédito y compras a cuotas
- `MetasView`: Metas de ahorro con seguimiento
- `FlujoView`: Proyección del flujo diario
- `CategoriasView`: Gestión de categorías y presupuestos
- `NavbarView` / `ConfiguracionView`: Navegación y configuración

### 3. **Controlador (Controller)**

**router.js**: Coordina la navegación SPA y maneja todos los eventos del usuario.
- `Router`: Clase que gestiona el enrutamiento entre vistas
- Métodos de navegación (`navigate`, `render`)
- Setup de listeners para cada sección
- Orquestación entre modelos y vistas

### 4. **Datos (Data)**

**seedData.js**: Datos de ejemplo iniciales para la primera carga.
- Salario, categorías, gastos, tarjetas, metas de ejemplo

## 🚀 Características Funcionales

### 1. Gestión de Salario
- Registrar salario neto mensual
- Configurar día de cobro
- Visualización clara del ingreso base

### 2. Gastos Fijos
- Crear, editar y eliminar gastos mensuales recurrentes
- Asociar a categorías
- Especificar día de vencimiento
- Marcar como activo/inactivo

### 3. Gastos Variables
- Registro de gastos no recurrentes
- Marcar como pagado/pendiente
- Fecha específica de gasto
- Categorización

### 4. Ingresos Extra
- Agregar ingresos adicionales
- Establecer fecha esperada
- Seguimiento de ingresos no regulares

### 5. Gestión de Tarjetas de Crédito
- **Múltiples tarjetas**: Crear y administrar varias tarjetas
- **Compras a Cuotas**: 
  - Registrar compras con número total de cuotas
  - Rastrear cuotas pagadas
  - Cálculo automático de:
    - Valor por cuota
    - Monto restante
    - Cuotas pendientes
- **Pago Mensual Estimado**: Calcula automáticamente el total a pagar este mes
- **Límite Disponible**: Muestra saldo actual vs límite

### 6. Metas de Ahorro
- Crear metas con objetivo monetario
- Fecha objetivo (opcional)
- **Aportes Automáticos**: Descuenta automáticamente cada mes
- **Barra de Progreso**: Visualización clara del avance
- **Cálculo Automático**: Cuánto ahorrar por mes para alcanzar la meta

### 7. Flujo de Caja Proyectado
- **Proyección diaria**: 30-60 días adelante
- **Saldo día a día**: Incluye todos los eventos:
  - Ingresos (salario, extra)
  - Gastos fijos
  - Gastos variables pagados
  - Pagos de tarjetas
  - Aportes a metas
- **Alertas**: Resalta días con saldo negativo
- **Visualización**: Tabla clara con evento, monto y saldo acumulado

### 8. Categorías y Presupuestos
- **Categorías Personalizables**: Crear y eliminar categorías
- **Emojis e Iconos**: Asociar ícono a cada categoría
- **Presupuestos Mensuales**: Establecer límite por categoría
- **Alertas de Presupuesto**: Notificación si se excede el límite

### 9. Dashboard Principal
- **KPIs**: Dinero libre, deuda tarjetas, metas activas
- **Resumen Mensual**: Breakdown de ingresos y gastos
- **Alertas**: Presupuestos excedidos y saldos negativos proyectados
- **Metas Destacadas**: Progreso visual de metas principales

### 10. Navegación SPA
- **Sin recargas**: Navegación fluida entre secciones
- **Navbar moderno**: Con modo oscuro/claro
- **Menú responsivo**: Adapta a dispositivos móviles

### 11. Persistencia y Backups
- **localStorage**: Todos los datos se guardan localmente
- **Exportar JSON**: Descargar backup completo
- **Importar JSON**: Restaurar datos desde backup
- **Reset**: Opción para restaurar datos de ejemplo

## 🎨 Tecnologías Utilizadas

- **HTML5**: Semántica moderna
- **CSS3 con Tailwind CSS** (CDN): Diseño responsive y esquema de colores
- **JavaScript ES6+**: Módulos, clases, async/await
- **localStorage**: Persistencia de datos en navegador
- **Módulos ES6**: Importación/exportación de componentes

## 📱 Características de UX/UI

- **Responsive Design**: Se adapta a mobile, tablet y desktop
- **Modo Oscuro/Claro**: Preferencia del usuario en localStorage
- **Animaciones Suaves**: Transiciones fluidas entre vistas
- **Validación de Formularios**: Montos positivos, fechas válidas
- **Alertas Visuales**: Colores para estados (rojo = negativo, verde = positivo)
- **Barras de Progreso**: Para metas y utilización de crédito

## 🔄 Flujo de Interacción

1. **Insertar datos**: Gastos, ingresos, tarjetas, metas
2. **Sistema calcula**: Automáticamente actualiza totales y proyecciones
3. **Vistas se actualizan**: Dashboard refleja cambios en tiempo real
4. **Flujo se regenera**: Proyecciones se recalculan con datos nuevos
5. **Alertas se disparan**: Si presupuesto se excede o saldo es negativo

## 💾 Persistencia de Datos

Todos los datos se guardan automáticamente en `localStorage` bajo la clave `copcash_app_data`:

```javascript
{
  salario: { monto, diaCobro, descripcion },
  categorias: [],
  gastosFijos: [],
  gastosVariables: [],
  ingresosExtra: [],
  tarjetas: [{ compras: [] }],
  metas: []
}
```

## 🚀 Cómo Iniciar

1. Ir a `/copcash/index.html` en un servidor local
2. La app se carga con datos de ejemplo automáticamente
3. Navegar con el menú superior
4. Todos los cambios se guardan instantáneamente

## 📊 Cálculos Principales

### Dinero Libre
```
= Salario 
  - Gastos Fijos 
  - Gastos Variables (pagados)
  - Cuotas de Tarjetas (este mes)
  - Aportes Automáticos a Metas
```

### Valor Cuota Tarjeta
```
= Monto Total / Número Total de Cuotas (redondeado a 2 decimales)
```

### Pago Mensual Tarjeta
```
= Suma de: (Valor Cuota × 1) para cada compra con cuotas restantes > 0
```

### Progreso Meta
```
= (Monto Actual / Monto Objetivo) × 100%
```

### Ahorro Requerido por Mes
```
= Monto Faltante / Meses Restantes (si tiene fecha objetivo)
```

## 🔒 Seguridad

- Datos almacenados localmente (no se envían a servidores)
- Validación de entrada en formularios
- Backup regular recomendado

## 📝 Notas Importantes

- Los datos NO se sincronizarán entre dispositivos distintos
- Cada navegador tiene su propio localStorage
- Se recomienda exportar datos periódicamente
- El modo oscuro se guarda en preferencias

## 🎯 Casos de Uso

1. **Presupuesto Personal**: Controlar gastos mensuales
2. **Planificación Financiera**: Proyectar flujo de caja
3. **Metas de Ahorro**: Seguimiento de ahorros hacia objetivos
4. **Deuda de Tarjetas**: Rastrear cuotas y saldos
5. **Análisis Gastos**: Por categoría y patrones

## 👨‍💻 Desarrollo

Estructura de componentes reutilizables y mantenibles:
- Cada vista es independiente
- Modelo centralizado de datos
- Controller orquesta la interacción
- Fácil de extender con nuevas vistas/funcionalidades

---

**Version**: 1.0.0  
**License**: MIT  
**Autor**: Generado por AI  
**Última actualización**: Marzo 2026
