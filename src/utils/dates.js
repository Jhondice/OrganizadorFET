/** Utilidades de fecha. Todas las fechas de negocio son cadenas ISO `YYYY-MM-DD` (sin zona horaria). */

export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const MONTHS_SHORT_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const pad = (n) => String(n).padStart(2, '0');

/** Fecha local de hoy (NO usa toISOString, que devuelve UTC y falla por las tardes en Colombia). */
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Nº de día absoluto (para restar fechas sin problemas de zona horaria / DST). */
export function dayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export const daysBetween = (a, b) => dayNum(b) - dayNum(a);

export function formatDate(iso) {
  if (!iso) return '—';
  if (!isISODate(iso)) return String(iso);
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Último día del mes (month: 1-12). */
export function endOfMonthISO(year, month) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(last)}`;
}

export function formatDateTime(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
