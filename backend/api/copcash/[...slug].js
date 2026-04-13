import { setCors, handleError } from '../../lib/copcash/_helpers.js';
import authLogin from '../../lib/copcash/auth/login.js';
import authRegister from '../../lib/copcash/auth/register.js';
import categorias from '../../lib/copcash/categorias.js';
import categoriaById from '../../lib/copcash/categorias/[id].js';
import gastosFijos from '../../lib/copcash/gastos-fijos.js';
import gastoFijoById from '../../lib/copcash/gastos-fijos/[id].js';
import gastosVariables from '../../lib/copcash/gastos-variables.js';
import gastoVariableById from '../../lib/copcash/gastos-variables/[id].js';
import ingresosExtra from '../../lib/copcash/ingresos-extra.js';
import ingresoExtraById from '../../lib/copcash/ingresos-extra/[id].js';
import metas from '../../lib/copcash/metas.js';
import metaById from '../../lib/copcash/metas/[id].js';
import salario from '../../lib/copcash/salario.js';
import tarjetas from '../../lib/copcash/tarjetas.js';
import tarjetaById from '../../lib/copcash/tarjetas/[id].js';
import compras from '../../lib/copcash/tarjetas/[id]/compras.js';
import compraById from '../../lib/copcash/tarjetas/[id]/compras/[compraId].js';

function ensureQuery(req, key, value) {
  req.query = { ...req.query, [key]: value };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const slug = req.query.slug || [];
    const path = Array.isArray(slug) ? slug : [slug];

    if (path.length === 0) {
      return res.status(404).json({ error: 'CopCash route not found' });
    }

    if (path[0] === 'auth') {
      if (path[1] === 'login') return authLogin(req, res);
      if (path[1] === 'register') return authRegister(req, res);
    }

    if (path[0] === 'categorias') {
      if (path.length === 1) return categorias(req, res);
      ensureQuery(req, 'id', path[1]);
      return categoriaById(req, res);
    }

    if (path[0] === 'gastos-fijos') {
      if (path.length === 1) return gastosFijos(req, res);
      ensureQuery(req, 'id', path[1]);
      return gastoFijoById(req, res);
    }

    if (path[0] === 'gastos-variables') {
      if (path.length === 1) return gastosVariables(req, res);
      ensureQuery(req, 'id', path[1]);
      return gastoVariableById(req, res);
    }

    if (path[0] === 'ingresos-extra') {
      if (path.length === 1) return ingresosExtra(req, res);
      ensureQuery(req, 'id', path[1]);
      return ingresoExtraById(req, res);
    }

    if (path[0] === 'metas') {
      if (path.length === 1) return metas(req, res);
      ensureQuery(req, 'id', path[1]);
      return metaById(req, res);
    }

    if (path[0] === 'salario' && path.length === 1) {
      return salario(req, res);
    }

    if (path[0] === 'tarjetas') {
      if (path.length === 1) return tarjetas(req, res);
      ensureQuery(req, 'id', path[1]);
      if (path.length === 2) return tarjetaById(req, res);
      if (path[2] === 'compras') {
        if (path.length === 3) return compras(req, res);
        ensureQuery(req, 'compraId', path[3]);
        return compraById(req, res);
      }
    }

    return res.status(404).json({ error: 'CopCash route not found' });
  } catch (err) {
    handleError(res, err);
  }
}
