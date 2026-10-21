import fs from 'node:fs/promises';

const [csvPath, mode] = process.argv.slice(2);
const apply = mode === '--apply';
const apiUrl = 'https://skaylabs.pages.dev/api/discordia/products';

if (!csvPath) {
  throw new Error('Uso: node scripts/import-august-purchase.mjs <archivo.csv> [--apply]');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(field); field = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some(value => value !== '')) rows.push(row);
  const [headers, ...data] = rows;
  return data.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function money(value) {
  return Number(String(value).replace(/[$,\s]/g, ''));
}

function normalizedCode(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/#0+(\d+)/g, '#$1')
    .trim();
}

function categoryFor(name) {
  const value = name.toUpperCase();
  if (/GEL FIJADOR|CEJAS/.test(value)) return 'CEJAS';
  if (/PESTAÑINA|Pestañina|PES(TA|T)ÑINA/.test(value)) return 'OJOS';
  if (/RUBOR|ILUMINADOR|BRONCEADORA|MALTEADA/.test(value)) return 'PIEL';
  if (/SPLASH|PRIMER/.test(value)) return 'SKIN';
  if (/BRILLO|LIP |KIT LABIOS|KIT PIZZA/.test(value)) return 'LABI';
  return 'ACCE';
}

const aliases = new Map([
  ['ID02', 'STN-ID02'],
]);

const csv = await fs.readFile(csvPath, 'utf8');
const incoming = parseCsv(csv).map(row => ({
  name: row.Producto.trim(),
  code: row.Código.trim(),
  stock: Number(row.Cantidad),
  cost_price: money(row['Precio unitario']),
  category: categoryFor(row.Producto),
}));

const response = await fetch(apiUrl);
if (!response.ok) throw new Error(`No se pudo leer el catálogo (${response.status}).`);
const payload = await response.json();
if (!payload.ok) throw new Error(payload.message || 'La API no devolvió el catálogo.');

const existingByCode = new Map(payload.data.map(product => [normalizedCode(product.code), product]));
const operations = incoming.map(item => {
  const lookup = aliases.get(normalizedCode(item.code)) || normalizedCode(item.code);
  const existing = existingByCode.get(lookup);
  if (existing) {
    return {
      type: 'update', item, existing,
      body: {
        ...existing,
        stock: Number(existing.stock) + item.stock,
        cost_price: item.cost_price,
        code: existing.code,
      },
    };
  }
  return {
    type: 'create', item,
    body: {
      ...item,
      price: 0,
      active: false,
      image: 'assets/default.png',
      description: 'Pendiente de precio público.',
    },
  };
});

const updates = operations.filter(operation => operation.type === 'update');
const creates = operations.filter(operation => operation.type === 'create');
console.table(operations.map(operation => ({
  operación: operation.type === 'update' ? 'Sumar stock' : 'Crear inactivo',
  código: operation.item.code,
  producto: operation.item.name,
  cantidad: operation.item.stock,
  resultado: operation.type === 'update'
    ? `${operation.existing.stock} → ${operation.body.stock}`
    : 'precio pendiente',
})));
console.log(`Resumen: ${updates.length} reposiciones y ${creates.length} productos nuevos.`);

if (!apply) {
  console.log('Vista previa únicamente. Añade --apply para ejecutar la carga.');
  process.exit(0);
}

for (const operation of operations) {
  const method = operation.type === 'update' ? 'PUT' : 'POST';
  const result = await fetch(apiUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(operation.body),
  });
  const resultPayload = await result.json();
  if (!result.ok || !resultPayload.ok) {
    throw new Error(`${operation.item.code}: ${resultPayload.message || result.statusText}`);
  }
}

console.log('Importación completada.');
