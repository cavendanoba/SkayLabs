# 🔧 Migraciones SQL Necesarias - Bug Fixes

**Fecha:** 2026-08-01

## ✅ Cambios Realizados

Se arreglaron 3 errores principales en el panel admin:

1. ✓ **Pestaña de clientes no traía datos** → Ahora extrae desde ventas
2. ✓ **Deudas mostraban "null x1"** → Ahora usa campo correcto `name`
3. ✓ **Dashboard no calculaba deudas** → Ahora calcula desde tabla `sales`

---

## ⚠️ IMPORTANTE: Migración SQL Requerida

Para que los cambios funcionen correctamente, **LA TABLA `sale_items` DEBE TENER UNA COLUMNA `name`**.

### Verificar si existe la columna:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sale_items' AND column_name = 'name';
```

### Si NO existe, ejecutar esta migración:

```sql
ALTER TABLE sale_items 
ADD COLUMN name VARCHAR(255);
```

### Opcional: Llenar datos históricos

Si ya hay datos en `sale_items` sin nombres, puedes llenarlos:

```sql
UPDATE sale_items si
SET name = p.name
FROM products p
WHERE si.product_id = p.id AND si.name IS NULL;

-- Llenar los que no encuentren producto con un valor por defecto
UPDATE sale_items
SET name = COALESCE(name, 'Producto')
WHERE name IS NULL;
```

---

## 🔄 Cambios de Código Realizados

### 1. Backend: `functions/api/discordia/sales.js`
```diff
+ INSERT INTO sale_items (sale_id, product_id, name, quantity, price)
- INSERT INTO sale_items (sale_id, product_id, quantity, price)

+ ${item.name || item.productName || 'Producto'},
```

**Razón:** Guardar el nombre del producto para que persista incluso si se elimina el producto.

### 2. Backend: `functions/api/discordia/dashboard.js`
```diff
- sql`SELECT id, name, phone, total_debt FROM customers WHERE total_debt > 0`
+ sql`SELECT s.id, s.customer_name, s.customer_phone, 
+        (s.total - COALESCE(s.amount_paid, 0))::numeric AS total_debt
+  FROM sales s
+  WHERE s.payment_status = 'pending'`
```

**Razón:** La tabla `customers` no existe. Calcular deudas desde `sales`.

```diff
- COALESCE(p.name, si.product_name)
+ COALESCE(p.name, si.name)
```

**Razón:** Usar el campo correcto de `sale_items`.

### 3. Frontend: `discordia/modules/deudas.js`
```diff
- const itemNames = (v.items||[]).map(i=>`${i.product_name} x${i.quantity}`).join(', ') || '—';
+ <p>${i.name||i.productName||'Producto'} ×${i.quantity}</p>
```

**Razón:** Usar `name` en lugar de `product_name`.

### 4. Frontend: `discordia/admin.js`
Reescrito `renderCustomersTab()`:
- Extrae clientes desde `state.sales` en lugar de `state.customers`
- Agrupa por nombre de cliente
- Calcula total_spent y total_debt

**Razón:** La tabla de clientes está vacía; los datos están en las ventas.

### 5. Frontend: `discordia/modules/ventas.js`
```diff
+ name: i.name || i.productName,
```

**Razón:** Enviar el campo `name` al backend cuando se crea/edita una venta.

---

## 🧪 Cómo Verificar que Funciona

1. **Ir a Admin → Clientes**
   - Debería mostrar lista de clientes desde las ventas
   - Mostrar total comprado y deuda pendiente

2. **Ir a Admin → Deudas**
   - Debería mostrar las ventas con `payment_status = 'pending'`
   - Productos NO deberían mostrar "null"
   - Deberían mostrar el nombre correcto

3. **Ir a Admin → Dashboard**
   - Debería mostrar "X clientes deben" si hay deudas
   - Sección de deudas activas debería mostrar cliente y cantidad
   - NO debería decir "Sin deudas pendientes" si hay ventas pending

4. **Crear una nueva venta**
   - Guardar con `payment_status = 'pending'`
   - Verificar que aparece en Deudas
   - Verificar que el nombre del cliente aparece en Clientes

---

## 📋 Pasos a Seguir

1. **Ejecutar la migración SQL**
   ```sql
   ALTER TABLE sale_items ADD COLUMN name VARCHAR(255);
   ```

2. **Llenar datos históricos (opcional)**
   ```sql
   UPDATE sale_items si
   SET name = p.name
   FROM products p
   WHERE si.product_id = p.id AND si.name IS NULL;
   
   UPDATE sale_items
   SET name = COALESCE(name, 'Producto')
   WHERE name IS NULL;
   ```

3. **Hacer deploy**
   ```bash
   git add .
   git commit -m "🐛 Fix: clientes, deudas y dashboard bugs"
   git push
   ```

4. **Probar en admin panel**
   - Crear venta de prueba con `payment_status = 'pending'`
   - Verificar que aparece en todas las pestañas

---

## 🚨 Si Falta la Columna `name`

Si la columna no existe y intentas crear una venta, obtendrás:
```
Error: column "name" does not exist
```

**Solución:**
1. Ejecutar migración SQL
2. Crear la venta nuevamente

---

## ✨ Resumen de Fixes

| Problema | Causa | Solución |
|----------|-------|----------|
| Clientes no aparecen | `state.customers` vacío | Extraer desde `state.sales` |
| Deudas muestran "null" | Campo incorrecto `product_name` | Usar campo correcto `name` |
| Dashboard sin deudas | Consulta a tabla `customers` inexistente | Calcular desde `sales` |
| 0 clientes deben | Misma causa anterior | Mismo fix |

---

## 🎯 Resultado Esperado

✅ **Pestaña Clientes:** Muestra clientes registrados con ventas  
✅ **Pestaña Deudas:** Muestra productos con nombres correctos (sin null)  
✅ **Dashboard:** Muestra deudas activas y cantidad de clientes que deben  

