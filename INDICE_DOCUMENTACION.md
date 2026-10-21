# 📚 Índice de Documentación - SkayLabs Discordia

## 📖 Documentos Disponibles

| Documento | Tamaño | Propósito | Cuándo Leerlo |
|-----------|--------|----------|--------------|
| **README.md** | 16 KB | Introducción y overview | 🟢 Primero (para entender qué es) |
| **ARQUITECTURA.md** | 19 KB | Arquitectura completa | 🟡 Segundo (para entender cómo funciona) |
| **GUIA_RAPIDA.md** | 11 KB | Referencia rápida de ubicaciones | 🟠 Durante desarrollo (consultas rápidas) |
| **RESUMEN_COMPLETO.md** | 8 KB | Resumen de cambios realizados | 🔵 Contexto (qué se hizo recientemente) |

---

## 🎓 Ruta de Aprendizaje Recomendada

### Para Principiantes (No conozco el proyecto)

```
1. Lee README.md (5 min)
   ├─ Qué es Discordia
   ├─ Stack técnico
   └─ Funcionalidades principales

2. Lee ARQUITECTURA.md - Secciones:
   ├─ Resumen General (2 min)
   ├─ Estructura de Carpetas (5 min)
   ├─ Flujo de Datos - Ver Catálogo (3 min)
   └─ Flujo de Datos - Crear Venta (5 min)

3. Explora el código
   ├─ Abre discordia/index.html (catálogo cliente)
   ├─ Abre discordia/admin.html (panel admin)
   └─ Lee discordia/app.js (router principal)

Tiempo total: ~30 minutos
```

### Para Desarrolladores (Necesito hacer un cambio)

```
1. Consulta GUIA_RAPIDA.md
   └─ Tabla de "Ubicación de Funcionalidades"
      → Encuentra dónde está lo que necesitas cambiar

2. Lee ARQUITECTURA.md
   └─ Sección "Flujos de Datos"
      → Entiende cómo fluye la información

3. Localiza archivos
   ├─ Frontend: discordia/
   └─ Backend: functions/api/discordia/

4. Haz cambios en ambos lados
   ├─ Modifica frontend
   ├─ Modifica backend
   └─ Prueba en admin panel

5. Documenta si es necesario
   └─ Actualiza GUIA_RAPIDA.md con nueva info

Tiempo variable: depende de cambio
```

### Para Mantenedores (Debo mantener el proyecto)

```
1. Lee README.md (orientación general)

2. Lee ARQUITECTURA.md COMPLETO
   ├─ Estructura de Carpetas
   ├─ Todos los Flujos de Datos
   ├─ Componentes Principales
   └─ Rutas API

3. Consulta GUIA_RAPIDA.md para searches rápidas

4. Conoce la BD (Sección "Base de Datos")
   ├─ Tablas
   ├─ Relaciones
   └─ Queries útiles

5. Entiende reglas importantes
   ├─ Event Propagation
   ├─ Queries Parametrizadas
   └─ Respuestas JSON

Tiempo total: 2-3 horas (una sola vez)
```

---

## 🔍 Buscar Funcionalidad Específica

### "¿Dónde está el código que..."

#### "...maneja el carrito de compras?"
```
GUIA_RAPIDA.md → Tabla "Catálogo y Carrito"
           ↓
Archivo: discordia/cart.js
Función: addToCart(productId, qty)
```

#### "...crea nuevas ventas?"
```
GUIA_RAPIDA.md → Tabla "Panel de Admin" → Ventas
           ↓
Archivo 1: discordia/modules/ventas.js
Función:   showNuevaVentaModal(container)
           ↓
Archivo 2: functions/api/discordia/sales.js
Función:   onRequestPost()
```

#### "...visualiza qué compró una cliente?"
```
ARQUITECTURA.md → Flujo 4: "Ver Compras de Cliente"
           ↓
Archivo: discordia/modules/ventas.js
Función: showVentaDetailsModal(saleId)
```

#### "...guarda datos en la base de datos?"
```
GUIA_RAPIDA.md → "Reglas Importantes" → "Queries Parametrizadas"
           ↓
Archivo: functions/api/discordia/_lib/db.js
Función: getSql(env)
```

---

## 🎯 Tareas Comunes y Dónde Encontrar Ayuda

| Tarea | Documento | Sección |
|-------|-----------|---------|
| Agregar nuevo campo a productos | ARQUITECTURA.md | Cómo Modificar Funcionalidades |
| Cambiar validación de ventas | GUIA_RAPIDA.md | Tareas Comunes #3 |
| Agregar nueva métrica al dashboard | GUIA_RAPIDA.md | Tareas Comunes #2 |
| Agregar nueva pestaña al admin | ARQUITECTURA.md | Cómo Modificar Funcionalidades |
| Debug: Modal se cierra al escribir | GUIA_RAPIDA.md | Debugging |
| Debug: Venta no guarda stock | README.md | Troubleshooting |
| Entender flujo de datos completo | ARQUITECTURA.md | Flujo de Datos |
| Ver estructura de carpetas | README.md | Estructura de Carpetas |

---

## 🔑 Conceptos Clave por Documento

### En README.md
- Qué es Discordia y para qué sirve
- Stack técnico y platform
- Funcionalidades para clientes y admin
- Estructura de carpetas resumida
- Rutas API principales
- Troubleshooting común
- Instrucciones de deployment

### En ARQUITECTURA.md
- Resumen de la arquitectura
- Para qué sirve cada carpeta (detallado)
- Por qué esa estructura (razones técnicas)
- Flujos de datos completos (6 ejemplos)
- Componentes y responsabilidades
- Base de datos (tablas y relaciones)
- Cómo comunicarse entre módulos
- Rutas API con ejemplos
- Cómo modificar funcionalidades

### En GUIA_RAPIDA.md
- Tabla de ubicación de funcionalidades
- Flujos comunes (copy-paste)
- Queries SQL útiles
- Tareas comunes paso a paso
- Reglas de desarrollo
- Tips de debugging
- Estructura resumida

### En RESUMEN_COMPLETO.md
- Qué se completó en esta sesión
- Funcionalidades nuevas
- Bugs arreglados
- Documentación creada
- Limpieza realizada
- Cómo usar la documentación
- Conceptos clave
- Reglas fundamentales

---

## 💡 Ejemplos de Búsqueda

### "Necesito cambiar cómo se calcula el total de una venta"

```
1. GUIA_RAPIDA.md
   └─ Busca "total" en la tabla de Ventas
   └─ Encontrarás: modules/ventas.js

2. ARQUITECTURA.md
   └─ Lee: "Flujo 3: Crear Nueva Venta"
   └─ Verás dónde se calcula el total

3. Ve a los archivos
   └─ discordia/modules/ventas.js (frontend)
   └─ functions/api/discordia/sales.js (backend)

4. Busca la lógica de cálculo
   └─ Frontend: updateItemsList() recalcula
   └─ Backend: Total se calcula en POST

5. Haz cambios en ambos lados
```

### "Agregué un nuevo campo a la BD, ¿cómo lo paso al frontend?"

```
1. ARQUITECTURA.md
   └─ Lee: "Cómo Modificar Funcionalidades" → "Agregar nuevo campo a Productos"

2. Sigue los pasos
   ├─ 1. BD: ALTER TABLE
   ├─ 2. Backend: Actualizar functions/api/discordia/products.js
   ├─ 3. Frontend: Actualizar admin.js
   └─ 4. Exportar: Verificar ambos lados

3. Prueba en admin panel
   └─ Crea/edita un producto
   └─ Verifica que nuevo campo aparece
```

---

## 📞 Estructura de Referencias Cruzadas

```
README.md (Vista General)
    ├─→ ARQUITECTURA.md (Detalles Completos)
    │   ├─→ GUIA_RAPIDA.md (Busquedas Rápidas)
    │   └─→ Código Fuente
    │
    └─→ GUIA_RAPIDA.md (Referencia Rápida)
        ├─→ ARQUITECTURA.md (Más Detalles)
        └─→ Código Fuente

RESUMEN_COMPLETO.md (Contexto Histórico)
    ├─→ Qué se cambió
    ├─→ Por qué se cambió
    └─→ Dónde encontrar en ARQUITECTURA.md
```

---

## ✨ Quick Links

### Documentos
- [📄 README.md](README.md) - Introducción
- [📖 ARQUITECTURA.md](ARQUITECTURA.md) - Arquitectura completa
- [⚡ GUIA_RAPIDA.md](GUIA_RAPIDA.md) - Referencia rápida
- [📋 RESUMEN_COMPLETO.md](RESUMEN_COMPLETO.md) - Cambios realizados

### Código Importante
- [Frontend Principal](discordia/app.js) - Router
- [Admin Panel](discordia/admin.js) - Orquestador
- [Gestión de Ventas](discordia/modules/ventas.js) - Lógica principal
- [API Backend](functions/api/discordia/sales.js) - REST API

### BD
- Hiperdrive ID: `a0e02ff7de744ed585d9639489bd0435`
- Tablas: products, sales, sale_items, debts

---

## 🚀 Flujo Recomendado para Cualquier Tarea

```
1. ¿QUÉ necesito hacer?
   └─ README.md → Entender contexto

2. ¿DÓNDE está el código?
   └─ GUIA_RAPIDA.md → Tabla de ubicaciones

3. ¿CÓMO funciona?
   └─ ARQUITECTURA.md → Flujos y componentes

4. ¿CUÁL es la estructura?
   └─ ARQUITECTURA.md → Secciones específicas

5. ¿QUÉ reglas debo seguir?
   └─ GUIA_RAPIDA.md → Reglas Importantes

6. HAGO el cambio
   └─ En frontend Y backend (juntos)

7. PRUEBO en admin panel
   └─ Verifica que funciona

8. DOCUMENTO si es necesario
   └─ Actualiza GUIA_RAPIDA.md
```

---

## 📊 Resumen de Documentación

- **Total de documentos:** 4 principales
- **Total de KB:** ~54 KB de documentación
- **Cobertura:** 100% del código y arquitectura
- **Ejemplos incluidos:** +20 ejemplos de código
- **Flujos documentados:** 6 flujos principales
- **APIs documentadas:** Todas (GET/POST/PUT/DELETE)
- **Tareas comunes:** 4+ tareas paso a paso

---

¡La documentación está completa y organizada! 📚✨

