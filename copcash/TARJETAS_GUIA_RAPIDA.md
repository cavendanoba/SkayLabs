# 🎯 Guía Rápida del Sistema de Tarjetas v2.0

## 📱 Interfaz Visual

```
╔════════════════════════════════════════════════════════════════════╗
║              💳 VISA ORO - Banco Popular                          ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  🏦 CUOTA A PAGAR (Este Período)                                  ║
║                                                                    ║
║  $400 COP                                    [🟢 5 días para pagar]║
║                                                                    ║
║  Fecha Pago: 25 abr 2026  │ Cierre: 20 abr  │ Interés: 19.32% TEA║
║                                                                    ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │ [✓ PAGAR CUENTA COMPLETA]    [💳 Pago Parcial]           │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  KPI CARDS                                                        ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  45% Uso    │  $2,750 Disponible │  $400 Saldo  │  $5,000 Límite ║
║  ▮▮▮▬▬▬▬▬  │  Verde             │  Neutral     │  Azul           ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  🛒 COMPRAS A CUOTAS (2 compras)                                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  LAPTOP DELL                                                      ║
║  💰 $1,200  │  Cuota: $200                 Restante: $800        ║
║  █████░░░░░░ (3/6 cuotas) 50%                                    ║
║                                                                    ║
║  MUEBLES SALA                                                     ║
║  💰 $800    │  Cuota: $200                 Restante: $600        ║
║  ███░░░░░░░░ (2/4 cuotas) 50%                                    ║
║                                                                    ║
╠════════════════════════════════════════════════════════════════════╣
║  📅 INFORMACIÓN                                                   ║
╠════════════════════════════════════════════════════════════════════╣
║  Próximo Cierre: 20 abr  │ Vencimiento: 25 abr  │ TEA: 19.32%    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🔴 Ejemplo: Pago Completo

### Paso 1: Ver Estado de Cuenta
```
┌─────────────────────────────────────┐
│ Cuota a Pagar: $400                │
│ Fecha: 25 abr 2026                 │
│ Días: 5 días                       │
└─────────────────────────────────────┘
```

### Paso 2: Hacer Clic en "Pagar Cuenta Completa"
```
Usuario da clic
↓
Sistema valida que hay $400 a pagar
↓
Muestra confirmación:
"✓ Pago de $400 en Visa Oro"
```

### Paso 3: Confirmación
```
¿Confirmar el pago completo de la cuenta?

✓ Se marca como pagado
✓ Las compras avanzan a la próxima cuota
✓ No hay intereses
```

### Resultado:
```
ANTES:
- Laptop: Cuota 3 de 6 ✓
- Muebles: Cuota 2 de 4 ✓

DESPUÉS:
- Laptop: Cuota 4 de 6 (progresa)
- Muebles: Cuota 3 de 4 (progresa)
- Saldo anterior: $0
- Interés: $0
```

---

## 🟠 Ejemplo: Pago Parcial (con Intereses)

### Paso 1: Ver Estado de Cuenta
```
Cuota a Pagar: $400
```

### Paso 2: Hacer Clic en "Pago Parcial"
```
Usuario da clic
↓
Sistema solicita monto
"¿Cuanto deseas pagar? [        ]"
→ Usuario ingresa: $250
```

### Paso 3: Validación
```
Cuota obligatoria: $400
Monto a pagar: $250
Diferencia: $150

⚠️ "Se generarán intereses sobre los $150"
```

### Paso 4: Confirmación
```
✓ Pago de $250 registrado
⚠️ Deuda restante: $150
💡 Se generarán intereses en el próximo período
```

### Resultado - Próximo Período:
```
ANTES (Este mes):
- Cuota a pagar: $400
- Pagaste: $250
- Deuda: $150

PRÓXIMO MES:
- Interés calculado: $150 × (19.32% ÷ 12) = $2.41
- Cuota nuevas: $400
- Total a pagar: $400 + $150 + $2.41 = $552.41
```

---

## 📊 Tabla Comparativa: Antes vs Después

| Aspecto | ANTES (v1.0) | AHORA (v2.0) |
|---------|--------------|-------------|
| **Modelo** | Pagar cuota individual | Pagar cuenta completa |
| **Intereses** | No se calculaban | ✓ Automáticos |
| **Control** | Por compra | Por período |
| **Urgencia** | No había alertas | Color rojo ≤3 días |
| **TEA** | No se utilizaba | Configurable (19.32% default) |
| **Deuda** | No se acumulaba | ✓ Se acumula si no pagas |
| **Interfaz** | Botones por compra | Estado de cuenta |

---

## 🧮 Cálculos Prácticos

### Escenario 1: Tarjeta Limpia
```
Compra 1: Laptop $1,200 (6 cuotas)    → $200/mes
Compra 2: Muebles $800 (4 cuotas)     → $200/mes

Mes 1: Pagar $400 (completo) → Sin intereses
Mes 2: Pagar $400 (completo) → Sin intereses
Mes 3: Pagar $400 (completo) → Sin intereses
```

### Escenario 2: Con Pago Parcial
```
Cuota de Mes 1: $400
Pagaste: $250 (parcial)
Deuda: $150

Mes 2:
  Cuota nuevas: $400
  Interés: $150 × (19.32/12) / 100 = $2.41
  Total: $402.41 + $150 = $552.41
```

### Escenario 3: Dos Meses Sin Pagar
```
Mes 1: Cuota $400 → No pagaste ($0)
Mes 2: 
  - Deuda anterior: $400
  - Interés: $400 × (19.32/12) / 100 = $6.44
  - Cuota nueva: $400
  - Total: $806.44
  
Mes 3:
  - Deuda anterior: $806.44
  - Interés: $806.44 × (19.32/12) / 100 = $12.99
  - Cuota nueva: $400
  - Total: $1,219.43
```

---

## ⚠️ Situaciones Especiales

### Caso: Tarjeta Llena (100% de uso)
```
Límite: $5,000
Saldo: $5,000 (100%)

⚠️ No puedes hacer más compras
💡 Paga al menos una cuota
```

### Caso: Límite Disponible Bajo
```
Límite: $5,000
Saldo: $4,800 (96%)
Disponible: $200

💡 Solo puedes gastar $200 más
```

### Caso: Próximo Vencimiento Hoy
```
Fechas:
- Hoy: 25 abr
- Vencimiento: 25 abr

🔴 ¡VENCE HOY!
Debes pagar inmediatamente
```

---

## 🎨 Indicadores Visuales

### Color de Urgencia por Días
```
🔴 ROJO:      0-3 días    (¡URGENTE!)
🟠 NARANJA:   4-7 días    (Próxima semana)
🟢 VERDE:     >7 días     (Tiempo de sobra)
```

### Colores por Estado
```
🔵 AZUL:      Info general (cuotas, límite)
🟢 VERDE:     Posit (disponible, pagado)
🟡 AMARILLO:  Atención (uso del crédito)
🔴 ROJO:      Crítico (urgencia, deuda)
```

---

## 🚀 Tips Prácticos

### ✓ Mejores Prácticas
1. **Paga siempre en tiempo** para evitar intereses
2. **Revisa el % de uso** para no llenar la tarjeta
3. **Nota la fecha de vencimiento** (marca en calendario)
4. **Si necesitas pagar parcial**, hazlo pronto para reducir intereses

### ❌ Evita
1. No dejes pasar la fecha de vencimiento
2. No hagas pagos parciales habitualmente
3. No superes el 80% de uso del crédito
4. No olvides que hay compras a cuotas pendientes

---

## 📞 Soporte

**¿Preguntas frecuentes?**

Q: ¿Puedo pagar solo una compra?  
A: No, debes pagar toda la cuenta del período.

Q: ¿Cuándo se calculan los intereses?  
A: Al mes siguiente si tienes deuda sin pagar.

Q: ¿Puedo cambiar la TEA?  
A: Sí, al editar la tarjeta.

Q: ¿Qué pasa si pago más de lo debido?  
A: Reduce la deuda del próximo mes.

---

**Ultima actualización:** Marzo 2026  
**Versión:** 2.0 - Estado de Cuenta con Intereses
