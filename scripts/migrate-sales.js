// scripts/migrate-sales.js
// ─────────────────────────────────────────────────────────────
// Migra ventas históricas desde el Excel a PostgreSQL (Neon)
// Agrupa las filas por cliente+fecha+canal para formar ventas
// Crea los clientes automáticamente si no existen
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ─── DATOS PROCESADOS DEL EXCEL ──────────────────────────────
// Cada objeto es una fila del Excel ya limpia y normalizada
const rows = [
  { customer: 'Mary', product: 'ILUMINADOR HORNEADO', price: 18000, qty: 2, total: 36000, status: 'paid', channel: 'Nequi', date: '2025-12-30T00:00:00.000Z' },
  { customer: 'Mary', product: 'SOMBRA BLOSSOM', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-30T00:00:00.000Z' },
  { customer: 'Mary', product: 'POLVO DE HADAS GOLDEN PHM2166', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Nequi', date: '2025-12-30T00:00:00.000Z' },
  { customer: 'Lorena', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Daviplata', date: '2025-12-22T00:00:00.000Z' },
  { customer: 'Lorena', product: 'CORRECTOR EN BARRA 8 TONOS', price: 4000, qty: 1, total: 4000, status: 'paid', channel: 'Daviplata', date: '2025-12-22T00:00:00.000Z' },
  { customer: 'Cate', product: 'ILUMINADOR HORNEADO', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Daviplata', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Cate', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Daviplata', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Cate', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Daviplata', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Cate', product: 'BRILLO DASH', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Daviplata', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Cate', product: 'POLVO DE HADAS GOLDEN PHM2166', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Daviplata', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Mayra', product: 'RUBOR LIQUIDO CON APLICADOR', price: 19000, qty: 1, total: 19000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Mayra', product: 'BRILLO LIP OIL SANDIA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Mayra', product: 'ILUMINADOR HIGHTOUILLE TRENDY', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Mayra', product: 'KIT BROCHA CEJAS ORGANICAS X2', price: 5000, qty: 1, total: 5000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Nancy cordi', product: 'TINTA PARA LABIOS', price: 9000, qty: 1, total: 9000, status: 'paid', channel: 'Daviplata', date: '2026-01-12T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'CORRECTOR EN BARRA 8 TONOS', price: 4000, qty: 1, total: 4000, status: 'paid', channel: 'Nequi', date: '2026-01-12T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'KIT X 4 ILUMINADOR DREAMS REF ID02', price: 15000, qty: 2, total: 30000, status: 'paid', channel: 'Nequi', date: '2026-01-12T00:00:00.000Z' },
  { customer: 'Tia Lili', product: 'TINTA PARA LABIOS', price: 9000, qty: 1, total: 9000, status: 'paid', channel: 'Nequi', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Angie', product: 'TINTA PARA LABIOS', price: 9000, qty: 1, total: 9000, status: 'paid', channel: 'Nequi', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Nury ma de cris', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 20000, qty: 1, total: 20000, status: 'paid', channel: 'Nequi', date: '2025-12-17T00:00:00.000Z' },
  { customer: 'Nury psicologa', product: 'ILUMINADOR HORNEADO', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Nequi', date: '2025-12-08T00:00:00.000Z' },
  { customer: 'Nury psicologa', product: 'TINTA PARA LABIOS', price: 9000, qty: 1, total: 9000, status: 'paid', channel: 'Nequi', date: '2025-12-08T00:00:00.000Z' },
  { customer: 'Nury psicologa', product: 'CORRECTOR EN BARRA 8 TONOS', price: 4000, qty: 1, total: 4000, status: 'paid', channel: 'Nequi', date: '2025-12-08T00:00:00.000Z' },
  { customer: 'Juliana Secre', product: 'RUBOR LIQUIDO CON APLICADOR + BROCHA', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Efectivo', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'Juliana Secre', product: 'POLVO DE HADAS GOLDEN PHM2166', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Efectivo', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'Juliana Secre', product: 'BRILLO RETRO KISSES', price: 8000, qty: 1, total: 8000, status: 'paid', channel: 'Efectivo', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'Juan Cordinador', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Efectivo', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'Wendy profe', product: 'RUBOR EN CREMA BEVERLY HILLS', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'NARA', product: 'BRILLO LIP OIL SANDIA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Daviplata', date: '2025-12-22T00:00:00.000Z' },
  { customer: 'LORENA (AMIGA MAY)', product: 'ILUMINADOR DE LUNA', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Nequi', date: '2025-12-22T00:00:00.000Z' },
  { customer: 'LORENA (AMIGA MAY)', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 20000, qty: 1, total: 20000, status: 'paid', channel: 'Nequi', date: '2025-12-22T00:00:00.000Z' },
  { customer: 'AMOR', product: 'RUBOR VERGÜENZA', price: 20000, qty: 1, total: 20000, status: 'paid', channel: 'Nequi', date: '2025-12-19T00:00:00.000Z' },
  { customer: 'Valentina prima cris', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Nequi', date: '2025-12-28T00:00:00.000Z' },
  { customer: 'Heidy', product: 'KIT BROCHA CEJAS ORGANICAS X2', price: 5000, qty: 1, total: 5000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'SOMBRA BLOSSOM', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'BRILLO LIP OIL SANDIA', price: 8000, qty: 1, total: 8000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'POLVOS SUELTOS BANANA', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'ENCRESPADOR ORO ROSA', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Daniela', product: 'RUBOR LIQUIDO CON APLICADOR + BROCHA', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Davivienda', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Daniela', product: 'BROCHA TRENDY DOBLE CEJAS CEPILLO', price: 5000, qty: 1, total: 5000, status: 'paid', channel: 'Davivienda', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Daniela', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Davivienda', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'MAMI', product: 'ENCRESPADOR ORO ROSA', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Davivienda', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'TATIANA (AMIGA MAY)', product: 'BRILLO LIP OIL SANDIA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'TATIANA (AMIGA MAY)', product: 'ILUMINADOR HIGHTOUILLE TRENDY', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'TATIANA (AMIGA MAY)', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'TATIANA (AMIGA MAY)', product: 'RUBOR LIQUIDO CON APLICADOR', price: 19000, qty: 1, total: 19000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'TATIANA (AMIGA MAY)', product: 'BRILLO DASH', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'LAURA PRACTICANTE', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 1, total: 10000, status: 'paid', channel: 'Efectivo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Lorena servicios generales', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 10000, qty: 2, total: 20000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  // Regalos (Kate asume el costo — canal: regalo)
  { customer: 'Kate', product: 'BRILLOS DE LOS RECUERDOS INTENSAMENTE', price: 7000, qty: 1, total: 7000, status: 'paid', channel: 'regalo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Kate', product: 'PIN TOY STORY', price: 7000, qty: 2, total: 14000, status: 'paid', channel: 'regalo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Kate', product: 'BRILLOS VILLAINS REF DY2105 HADES', price: 9000, qty: 1, total: 9000, status: 'paid', channel: 'regalo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Kate', product: 'LABIAL Y GLOSS ECLIPSE REF LBE1921', price: 8000, qty: 1, total: 8000, status: 'paid', channel: 'regalo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Kate', product: 'KIT BORLAS COTTON KBC2097', price: 4500, qty: 1, total: 4500, status: 'paid', channel: 'regalo', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Kate', product: 'PIN TOY STORY', price: 7000, qty: 1, total: 7000, status: 'paid', channel: 'regalo', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'DELINEADOR PLUMON TRDY DOBLE PUNTA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'CORRECTOR DE OJERAS AURA CTT2229', price: 20000, qty: 1, total: 20000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Luz Amanda Rectora', product: 'LABIAL Y GLOSS ECLIPSE REF LBE1921', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Lorena', product: 'POLVO DE HADAS GOLDEN PHM2166', price: 12000, qty: 1, total: 12000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Lorena', product: 'PIN TOY STORY', price: 10000, qty: 1, total: 10000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Lorena', product: 'BRILLOS VILLAINS REF DY2105 QUEEN', price: 15000, qty: 1, total: 15000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Mary', product: 'KIT BROCHAS BASICO LILA KBL2274', price: 15000, qty: 1, total: 15000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Juli', product: 'PESTAÑIÑA FORTALECEDORA FRESH FE5', price: 13000, qty: 2, total: 26000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Juli', product: 'BRILLOS VILLAINS REF DY2105 QUEEN', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Juli', product: 'DELINEADOR PLUMON TRDY DOBLE PUNTA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Juli', product: 'BRILLO HAPPY BERRY TRENDY REF BHB1744', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'BETUN PARA CEJAS CREMA Y POLVO', price: 18000, qty: 1, total: 18000, status: 'paid', channel: 'Nequi', date: '2026-03-08T00:00:00.000Z' },
  { customer: 'Carolina amiga cris', product: 'BRILLOS VILLAINS REF DY2105 URSULA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Efectivo', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Carolina amiga cris', product: 'PIN TOY STORY', price: 12000, qty: 3, total: 36000, status: 'paid', channel: 'Nequi', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Carolina amiga cris', product: 'PESTAÑIÑA FORTALECEDORA FRESH FE5', price: 14000, qty: 1, total: 14000, status: 'paid', channel: 'Nequi', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Carolina amiga cris', product: 'BRILLO GLOSS PRETTY THINGS REF BPT1963', price: 14000, qty: 1, total: 14000, status: 'paid', channel: 'Nequi', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Carolina amiga cris', product: 'KIT X 4 ILUMINADOR DREAMS REF ID02', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Efectivo', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'mateo', product: 'FIJADOR DREAMS', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'Nequi', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'mateo', product: 'KIT X 4 ILUMINADOR DREAMS REF ID02', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'Nequi', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'mateo', product: 'BRILLO LIP OIL SANDIA BLS2258', price: 11000, qty: 1, total: 11000, status: 'paid', channel: 'WhatsApp', date: '2026-01-31T00:00:00.000Z' },
  { customer: 'Tata', product: 'ENCRESPADOR ORO ROSA', price: 15000, qty: 1, total: 15000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Tata', product: 'BRILLOS VILLAINS REF DY2105', price: 12000, qty: 1, total: 12000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Magaly', product: 'PRODUCTO SIN ESPECIFICAR', price: 25000, qty: 1, total: 25000, status: 'paid', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Maria JDA', product: 'KIT LABIOS FURIA DY2098', price: 25000, qty: 1, total: 25000, status: 'PTE', channel: 'WhatsApp', date: '2025-12-01T00:00:00.000Z' },
  { customer: 'Heidy', product: 'LAPIZ DEL KIT FURIA', price: 5000, qty: 1, total: 5000, status: 'paid', channel: 'Nequi', date: '2026-03-08T00:00:00.000Z' },
];

// ─── AGRUPAR FILAS EN VENTAS ──────────────────────────────────
// Filas del mismo cliente + fecha + canal = una sola venta
const salesMap = new Map();

for (const row of rows) {
  const key = `${row.customer}|${row.date}|${row.channel}`;
  if (!salesMap.has(key)) {
    salesMap.set(key, {
      customer: row.customer,
      date: row.date,
      channel: row.channel,
      status: row.status,
      items: []
    });
  }
  salesMap.get(key).items.push({
    product: row.product,
    price: row.price,
    qty: row.qty,
    total: row.total
  });
}

// ─── MIGRACIÓN ────────────────────────────────────────────────
let salesCreated = 0;
let customersCreated = 0;

console.log(`Migrando ${salesMap.size} ventas con ${rows.length} items...\n`);

for (const [key, sale] of salesMap) {
  // 1. Upsert cliente — si ya existe no lo duplica
  const existing = await sql`SELECT id FROM customers WHERE name = ${sale.customer}`;
  let customerId;

  if (existing.length > 0) {
    customerId = existing[0].id;
  } else {
    const [newCustomer] = await sql`
      INSERT INTO customers (name) VALUES (${sale.customer}) RETURNING id
    `;
    customerId = newCustomer.id;
    customersCreated++;
  }

  // 2. Calcular total y estado de pago
  const total = sale.items.reduce((sum, i) => sum + (i.total || 0), 0);
  const paymentStatus = sale.status === 'PTE' ? 'pending' : 'paid';
  const amountPaid = paymentStatus === 'paid' ? total : 0;

  // 3. Insertar la venta
  const [newSale] = await sql`
    INSERT INTO sales (customer_id, total, channel, status, payment_status, amount_paid, created_at)
    VALUES (
      ${customerId},
      ${total},
      ${sale.channel},
      'completed',
      ${paymentStatus},
      ${amountPaid},
      ${sale.date}
    )
    RETURNING id
  `;

  // 4. Insertar items de la venta
  for (const item of sale.items) {
    await sql`
      INSERT INTO sale_items (sale_id, product_id, product_name, price, quantity)
      VALUES (${newSale.id}, NULL, ${item.product}, ${item.price || 0}, ${item.qty || 1})
    `;
  }

  // 5. Actualizar estadísticas del cliente
  await sql`
    UPDATE customers SET
      order_count      = order_count + 1,
      total_spent      = total_spent + ${amountPaid},
      total_debt       = total_debt  + ${paymentStatus === 'pending' ? total : 0},
      last_purchase_at = ${sale.date}
    WHERE id = ${customerId}
  `;

  salesCreated++;
  const icon = paymentStatus === 'paid' ? '✅' : '⚠️ ';
  console.log(`${icon} Venta #${newSale.id} — ${sale.customer} — $${total.toLocaleString()} — ${paymentStatus} — ${sale.channel}`);
}

console.log(`\n🎉 Migración completa:`);
console.log(`   Ventas creadas:   ${salesCreated}`);
console.log(`   Clientes nuevos:  ${customersCreated}`);
console.log(`\n⚠️  Deudas sin producto omitidas (agrégalas manualmente):`);
console.log(`   - Nury ma de cris`);
console.log(`   - Mayra`);