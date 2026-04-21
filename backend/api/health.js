export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  return res.status(200).json({ ok: true, status: 'healthy', service: 'SkayLabs backend' });
}
