import { isISODate } from '../utils/dates.js';
import { LIMITS, STATUSES } from './constants.js';

const str = (v) => (v == null ? '' : String(v).trim());
const clampInt = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : NaN;
};
const percentOf = (v) => clampInt(v === '' || v == null ? 0 : v);

export function normalizeActivity(input = {}) {
  const v = {
    periodo: str(input.periodo),
    nombre: str(input.nombre),
    tipo: str(input.tipo),
    linea: str(input.linea),
    responsable: str(input.responsable),
    fecha_inicio: str(input.fecha_inicio),
    fecha_fin: str(input.fecha_fin),
    avance: percentOf(input.avance),
    estado: str(input.estado),
    observaciones: str(input.observaciones),
  };
  // Regla de negocio: una actividad completada siempre está al 100 %.
  if (v.estado === 'Completada') v.avance = 100;
  return v;
}

/** Valida una actividad. `catalogs` es opcional; si se pasa, exige que periodo/tipo/linea existan. */
export function validateActivity(input, catalogs) {
  const value = normalizeActivity(input);
  const errors = {};
  if (!value.periodo) errors.periodo = 'Seleccione el periodo.';
  if (!value.nombre) errors.nombre = 'El nombre es obligatorio.';
  else if (value.nombre.length > LIMITS.nombre) errors.nombre = `Máximo ${LIMITS.nombre} caracteres.`;
  if (!value.tipo) errors.tipo = 'Seleccione el tipo.';
  if (!value.linea) errors.linea = 'Seleccione la línea estratégica.';
  if (!value.responsable) errors.responsable = 'El responsable es obligatorio.';
  else if (value.responsable.length > LIMITS.corto) errors.responsable = `Máximo ${LIMITS.corto} caracteres.`;
  if (!isISODate(value.fecha_inicio)) errors.fecha_inicio = 'Fecha inválida.';
  if (!isISODate(value.fecha_fin)) errors.fecha_fin = 'Fecha inválida.';
  if (!errors.fecha_inicio && !errors.fecha_fin && value.fecha_fin < value.fecha_inicio) {
    errors.fecha_fin = 'La fecha fin no puede ser anterior al inicio.';
  }
  if (Number.isNaN(value.avance)) errors.avance = 'Ingrese un número entre 0 y 100.';
  if (!STATUSES.includes(value.estado)) errors.estado = 'Estado no válido.';
  if (value.observaciones.length > LIMITS.obs) errors.observaciones = `Máximo ${LIMITS.obs} caracteres.`;
  if (catalogs) {
    for (const k of ['periodo', 'tipo', 'linea']) {
      if (!errors[k] && !(catalogs[k] || []).includes(value[k])) errors[k] = `"${value[k]}" no existe en el catálogo.`;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors, value };
}

export function normalizeReport(input = {}) {
  const v = {
    actividad_id: Number(input.actividad_id),
    fecha_reporte: str(input.fecha_reporte),
    avance_realizado: str(input.avance_realizado),
    dificultades: str(input.dificultades),
    resultados: str(input.resultados),
    acciones_siguientes: str(input.acciones_siguientes),
    porcentaje: percentOf(input.porcentaje),
    estado: str(input.estado),
    proxima_revision: str(input.proxima_revision),
    autor: str(input.autor),
  };
  if (v.estado === 'Completada') v.porcentaje = 100;
  return v;
}

export function validateReport(input) {
  const value = normalizeReport(input);
  const errors = {};
  if (!Number.isInteger(value.actividad_id) || value.actividad_id <= 0) errors.actividad_id = 'Seleccione una actividad.';
  if (!isISODate(value.fecha_reporte)) errors.fecha_reporte = 'Fecha de reporte inválida.';
  if (!value.avance_realizado) errors.avance_realizado = 'Describa el avance realizado.';
  for (const k of ['avance_realizado', 'dificultades', 'resultados', 'acciones_siguientes']) {
    if (value[k].length > LIMITS.texto) errors[k] = `Máximo ${LIMITS.texto} caracteres.`;
  }
  if (Number.isNaN(value.porcentaje)) errors.porcentaje = 'Ingrese un número entre 0 y 100.';
  if (!STATUSES.includes(value.estado)) errors.estado = 'Estado no válido.';
  if (value.proxima_revision && !isISODate(value.proxima_revision)) errors.proxima_revision = 'Fecha inválida.';
  if (value.autor.length > LIMITS.corto) errors.autor = `Máximo ${LIMITS.corto} caracteres.`;
  return { ok: Object.keys(errors).length === 0, errors, value };
}
