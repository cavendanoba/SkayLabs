const fs = require('node:fs');
const path = require('node:path');

const STORAGE_KEY = 'skc:db';
let inMemoryDb = null;

function buildDefaultDb() {
  try {
    const productsPath = path.join(process.cwd(), 'skcglow', 'data', 'products.json');
    const raw = fs.readFileSync(productsPath, 'utf8');
    const catalog = JSON.parse(raw);
    return {
      catalog: Array.isArray(catalog) ? catalog : [],
      sales: [],
      customers: [],
      updatedAt: new Date().toISOString(),
      source: 'seed'
    };
  } catch (error) {
    return {
      catalog: [],
      sales: [],
      customers: [],
      updatedAt: new Date().toISOString(),
      source: 'empty'
    };
  }
}

async function callKv(command) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status}`);
  }

  return response.json();
}

async function getDb() {
  const fallback = inMemoryDb || buildDefaultDb();

  try {
    const kvResponse = await callKv(['GET', STORAGE_KEY]);
    if (kvResponse && kvResponse.result) {
      const parsed = JSON.parse(kvResponse.result);
      inMemoryDb = parsed;
      return { db: parsed, storage: 'vercel-kv' };
    }

    if (kvResponse) {
      await callKv(['SET', STORAGE_KEY, JSON.stringify(fallback)]);
      inMemoryDb = fallback;
      return { db: fallback, storage: 'vercel-kv' };
    }
  } catch (error) {
    console.warn('KV unavailable, using memory fallback:', error.message);
  }

  inMemoryDb = fallback;
  return { db: fallback, storage: 'memory' };
}

async function saveDb(partial) {
  const { db: currentDb, storage } = await getDb();

  const nextDb = {
    ...currentDb,
    ...partial,
    updatedAt: new Date().toISOString()
  };

  try {
    const kvResponse = await callKv(['SET', STORAGE_KEY, JSON.stringify(nextDb)]);
    if (kvResponse) {
      inMemoryDb = nextDb;
      return { db: nextDb, storage: 'vercel-kv' };
    }
  } catch (error) {
    console.warn('KV write failed, storing in memory:', error.message);
  }

  inMemoryDb = nextDb;
  return { db: nextDb, storage };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET') {
    const { db, storage } = await getDb();
    return res.status(200).json({ ok: true, storage, data: db });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const payload = body.data || body;

      const partial = {
        ...(Array.isArray(payload.catalog) ? { catalog: payload.catalog } : {}),
        ...(Array.isArray(payload.sales) ? { sales: payload.sales } : {}),
        ...(Array.isArray(payload.customers) ? { customers: payload.customers } : {})
      };

      if (!Object.keys(partial).length) {
        return res.status(400).json({ ok: false, message: 'Payload inválido. Envía catalog/sales/customers.' });
      }

      const { db, storage } = await saveDb(partial);
      return res.status(200).json({ ok: true, storage, data: db });
    } catch (error) {
      return res.status(400).json({ ok: false, message: 'JSON inválido.', error: error.message });
    }
  }

  return res.status(405).json({ ok: false, message: 'Método no permitido' });
};
