import { dayNum, endOfMonthISO, MONTHS_SHORT_ES, pad } from '../utils/dates.js';

/** Estado efectivo: una actividad vencida y no completada se considera "Atrasada" automáticamente. */
export function effectiveStatus(a, today, autoOverdue = true) {
  if (!autoOverdue || a.estado === 'Completada') return a.estado;
  if (a.fecha_fin && a.fecha_fin < today && Number(a.avance) < 100) return 'Atrasada';
  return a.estado;
}

export function decorate(activities, today, autoOverdue = true) {
  return activities.map((a) => {
    const estado_efectivo = effectiveStatus(a, today, autoOverdue);
    return { ...a, estado_efectivo, auto_atrasada: estado_efectivo === 'Atrasada' && a.estado !== 'Atrasada' };
  });
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, n) => s + Number(n), 0) / arr.length) : 0);

/** `acts` debe venir decorado (con estado_efectivo). */
export function computeKpis(acts) {
  const total = acts.length;
  const by = (s) => acts.filter((a) => a.estado_efectivo === s).length;
  const completadas = by('Completada');
  const atrasadas = by('Atrasada');
  const riesgo = pct(atrasadas, total);
  return {
    total,
    completadas,
    enDesarrollo: by('En desarrollo'),
    pendientes: by('Pendiente') + by('Programada'),
    atrasadas,
    avanceGeneral: avg(acts.map((a) => a.avance)),
    efectividad: pct(completadas, total),
    riesgo,
    riesgoNivel: riesgo < 15 ? 'Bajo' : riesgo < 30 ? 'Medio' : 'Alto',
  };
}

export function countBy(acts, key) {
  const map = new Map();
  for (const a of acts) map.set(a[key], (map.get(a[key]) || 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function avgBy(acts, key) {
  const map = new Map();
  for (const a of acts) {
    if (!map.has(a[key])) map.set(a[key], []);
    map.get(a[key]).push(a.avance);
  }
  return [...map.entries()].map(([label, list]) => ({ label, value: avg(list) })).sort((a, b) => b.value - a.value);
}

/** Actividades no completadas ordenadas por fecha de vencimiento (las vencidas salen primero). */
export function upcoming(acts, limit = 5) {
  return acts
    .filter((a) => a.estado_efectivo !== 'Completada')
    .sort((a, b) => a.fecha_fin.localeCompare(b.fecha_fin) || a.numero - b.numero)
    .slice(0, limit);
}

/**
 * Curva de avance planificado vs. real por mes.
 *  - Planificado: interpolación lineal entre fecha_inicio y fecha_fin de cada actividad.
 *  - Real (meses cerrados): último informe registrado hasta el fin de mes (0 si no hay).
 *  - Real (mes actual): avance actual de cada actividad.
 *  - Meses futuros: null.
 */
export function trendSeries(acts, reports, today) {
  if (!acts.length) return { labels: [], planned: [], real: [] };
  const minStart = acts.reduce((m, a) => (a.fecha_inicio < m ? a.fecha_inicio : m), acts[0].fecha_inicio);
  const maxEnd = acts.reduce((m, a) => (a.fecha_fin > m ? a.fecha_fin : m), acts[0].fecha_fin);
  let y = Number(minStart.slice(0, 4));
  let m = Number(minStart.slice(5, 7));
  const endKey = maxEnd.slice(0, 7);
  const todayKey = today.slice(0, 7);

  const reportsByAct = new Map();
  for (const r of reports) {
    if (!reportsByAct.has(r.actividad_id)) reportsByAct.set(r.actividad_id, []);
    reportsByAct.get(r.actividad_id).push(r);
  }

  const labels = [];
  const planned = [];
  const real = [];
  for (let guard = 0; guard < 36; guard++) {
    const key = `${y}-${pad(m)}`;
    const monthEnd = endOfMonthISO(y, m);
    labels.push(`${MONTHS_SHORT_ES[m - 1]} ${String(y).slice(2)}`);

    planned.push(
      avg(acts.map((a) => {
        const s = dayNum(a.fecha_inicio);
        const e = dayNum(a.fecha_fin);
        const t = dayNum(monthEnd);
        if (t < s) return 0;
        if (t >= e) return 100;
        return ((t - s + 1) / (e - s + 1)) * 100;
      })),
    );

    if (key > todayKey) real.push(null);
    else if (key === todayKey) real.push(avg(acts.map((a) => a.avance)));
    else {
      real.push(
        avg(acts.map((a) => {
          const list = (reportsByAct.get(a.id) || []).filter((r) => r.fecha_reporte <= monthEnd);
          if (!list.length) return 0;
          list.sort((x, z) => x.fecha_reporte.localeCompare(z.fecha_reporte) || x.id - z.id);
          return list[list.length - 1].porcentaje;
        })),
      );
    }
    if (key >= endKey) break;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return { labels, planned, real };
}

/** Informes de una actividad, del más reciente al más antiguo. */
export function reportsOf(reports, actividadId) {
  return reports
    .filter((r) => r.actividad_id === actividadId)
    .sort((a, b) => b.fecha_reporte.localeCompare(a.fecha_reporte) || b.id - a.id);
}

export const latestReport = (reports, actividadId) => reportsOf(reports, actividadId)[0] || null;
