// Modulo que funciona para: /backend/api/discordia/[...slug].js
// Este archivo es un "catch-all" que redirige a los handlers específicos según el path.

import adminLoginHandler from './admin-login.js';
import dashboardHandler from './dashboard.js';
import discordiaDataHandler from './discordia-data.js';
import paymentsHandler from './payments.js';
import productsHandler from './products.js';
import salesHandler from './sales.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  try {
    const slug = req.query.slug || [];
    const path = Array.isArray(slug) ? slug : [slug];

    if (path.length === 0) {
      return res.status(404).json({ ok: false, message: 'Discordia route not found' });
    }

    const resource = path[0];

    // Enrutar según el primer segmento
    switch (resource) {
      case 'admin-login':
        return adminLoginHandler(req, res);
      
      case 'dashboard':
        return dashboardHandler(req, res);
      
      case 'discordia-data':
        return discordiaDataHandler(req, res);
      
      case 'payments':
        return paymentsHandler(req, res);
      
      case 'products':
        // Si hay más segmentos (ej: /products/123), pasar el ID a través de query
        if (path.length > 1) {
          req.url = `/api/discordia/products/${path.slice(1).join('/')}`;
        }
        return productsHandler(req, res);
      
      case 'sales':
        // Si hay más segmentos (ej: /sales/123), pasar el ID a través de query
        if (path.length > 1) {
          req.url = `/api/discordia/sales/${path.slice(1).join('/')}`;
        }
        return salesHandler(req, res);
      
      default:
        return res.status(404).json({ ok: false, message: 'Discordia route not found' });
    }
  } catch (err) {
    console.error('Discordia route error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
}
