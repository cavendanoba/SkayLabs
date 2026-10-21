import './entorno.js';
import { migrar } from './db.js';
import { crearApp } from './app.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

await migrar();
crearApp().listen(PORT, HOST, () => {
  console.log(`CopCash escuchando en http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
