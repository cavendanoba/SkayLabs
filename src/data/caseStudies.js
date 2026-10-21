export const caseStudies = [
  {
    name: 'Discordia',
    tag: 'Migración',
    problem: 'Costos y límites de Vercel + Neon en un sistema de ventas en producción.',
    decision: 'Migrar a Cloudflare Pages + PostgreSQL autoalojado, conectado vía Cloudflare Hyperdrive.',
    result: 'Base de datos ahora self-hosted, costo fijo, y de paso se corrigió una inyección SQL heredada del código original.',
  },
  {
    name: 'CopCash',
    tag: 'Producto propio',
    problem: 'Necesidad personal de control financiero sin depender de apps de terceros.',
    decision: 'Construir una app propia con backend en Node.js y base de datos en mi servidor.',
    result: 'App corriendo en producción en mi propia infraestructura, con dashboard y gráficos en tiempo real.',
  },
];
