// functions/api/discordia/upload-image.js
// POST (solo admin, lo exige _middleware.js) → guarda una foto en R2 y devuelve su URL.
// La URL queda en el campo "image" del producto cuando se guarda el formulario.

import { json } from './_lib/db.js';
import { guardarImagen, TIPOS, MAX_BYTES } from './_lib/images.js';

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: 'No se recibió la imagen.' }, 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok: false, message: 'Falta el archivo.' }, 400);
  if (!TIPOS[file.type]) return json({ ok: false, message: 'Usa una imagen JPG, PNG o WebP.' }, 400);
  if (file.size > MAX_BYTES) return json({ ok: false, message: 'La imagen supera los 3 MB.' }, 400);

  const url = await guardarImagen(env, await file.arrayBuffer(), file.type);
  return json({ ok: true, url }, 201);
}
