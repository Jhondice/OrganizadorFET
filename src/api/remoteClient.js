// Cliente contra el backend real (Google Apps Script + Google Sheets).
//
// Se envía SIEMPRE como POST con el cuerpo en texto plano que contiene JSON (nunca
// "application/json"): así el navegador no dispara una petición preflight OPTIONS, que los
// Web Apps de Apps Script no responden de forma fiable y haría fallar la petición por CORS.
import { ApiError } from './errors.js';

const TIMEOUT_MS = 20000;

export function createRemoteClient(url) {
  async function call(action, payload = {}, token) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ action, token: token || null, payload }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new ApiError('TIMEOUT', 'El servidor tardó demasiado en responder.');
      throw new ApiError('NETWORK', 'No fue posible conectar con la hoja de cálculo. Verifique su conexión o la URL configurada.');
    } finally {
      clearTimeout(timer);
    }

    let body;
    try {
      body = await res.json();
    } catch {
      throw new ApiError('BAD_RESPONSE', 'La URL configurada no devolvió una respuesta reconocible. Verifique que apunte a la implementación (…/exec) correcta de Apps Script.');
    }
    if (!body || typeof body !== 'object') throw new ApiError('BAD_RESPONSE', 'Respuesta vacía del servidor.');
    if (!body.ok) {
      const err = body.error || {};
      throw new ApiError(err.code || 'INTERNAL', err.message || 'Ocurrió un error inesperado en el servidor.', err.fields);
    }
    return body.data;
  }

  return { kind: 'remote', call };
}
