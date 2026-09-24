import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isISODate, dayNum, daysBetween, formatDate, endOfMonthISO, todayISO } from '../src/utils/dates.js';
import { csvCell, toCsv } from '../src/utils/csv.js';
import { decorate, computeKpis, countBy, upcoming, reportsOf, trendSeries } from '../src/domain/stats.js';
import { SEED } from '../src/data/seed.js';

describe('utils/dates', () => {
  test('isISODate valida formato y calendario real', () => {
    assert.equal(isISODate('2026-02-29'), false); // 2026 no es bisiesto
    assert.equal(isISODate('2024-02-29'), true);
    assert.equal(isISODate('2026-13-01'), false);
    assert.equal(isISODate('no-es-fecha'), false);
  });

  test('dayNum/daysBetween no se ven afectados por el horario de verano', () => {
    assert.equal(daysBetween('2026-01-01', '2026-01-11'), 10);
    assert.equal(dayNum('2026-01-02') - dayNum('2026-01-01'), 1);
  });

  test('formatDate produce DD/MM/AAAA', () => {
    assert.equal(formatDate('2026-08-05'), '05/08/2026');
    assert.equal(formatDate(''), '—');
  });

  test('endOfMonthISO calcula el último día del mes, incluidos años bisiestos', () => {
    assert.equal(endOfMonthISO(2026, 2), '2026-02-28');
    assert.equal(endOfMonthISO(2024, 2), '2024-02-29');
    assert.equal(endOfMonthISO(2026, 12), '2026-12-31');
  });

  test('todayISO nunca produce un desfase de zona horaria (usa hora local)', () => {
    const iso = todayISO(new Date(2026, 0, 15, 23, 59));
    assert.equal(iso, '2026-01-15');
  });
});

describe('utils/csv', () => {
  test('neutraliza inyección de fórmulas', () => {
    assert.equal(csvCell('=CMD()'), "'=CMD()");
    assert.equal(csvCell('+1+1'), "'+1+1");
    assert.equal(csvCell('texto normal'), 'texto normal');
  });

  test('escapa comillas, separador y saltos de línea', () => {
    assert.equal(csvCell('a;b'), '"a;b"');
    assert.equal(csvCell('línea1\nlínea2'), '"línea1\nlínea2"');
    assert.equal(csvCell('dice "hola"'), '"dice ""hola"""');
  });

  test('toCsv arma encabezado + filas con BOM y soporta columnas calculadas', () => {
    const csv = toCsv([{ a: 1, b: 'x' }], [{ label: 'A', key: 'a' }, { label: 'B', value: (r) => r.b.toUpperCase() }]);
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(csv.includes('A;B'));
    assert.ok(csv.includes('1;X'));
  });
});

describe('domain/stats', () => {
  const today = '2026-09-20';
  const acts = decorate(SEED.activities, today);

  test('decorate marca como Atrasada una actividad vencida y no completada', () => {
    const a4 = acts.find((a) => a.id === 4); // Pendiente, vence 2026-09-30 -> aún no atrasada en esta fecha
    assert.equal(a4.estado_efectivo, 'Pendiente');
    const decoradasFuturo = decorate(SEED.activities, '2026-10-15');
    const a4Futuro = decoradasFuturo.find((a) => a.id === 4);
    assert.equal(a4Futuro.estado_efectivo, 'Atrasada');
  });

  test('decorate no reclasifica actividades completadas aunque estén vencidas', () => {
    const a1 = acts.find((a) => a.id === 1); // Completada, fecha_fin en el pasado
    assert.equal(a1.estado_efectivo, 'Completada');
  });

  test('computeKpis: los conteos por estado suman el total', () => {
    const k = computeKpis(acts);
    assert.equal(k.completadas + k.enDesarrollo + k.pendientes + k.atrasadas, k.total);
    assert.ok(k.avanceGeneral >= 0 && k.avanceGeneral <= 100);
  });

  test('countBy agrupa y cuenta correctamente', () => {
    const byTipo = countBy(acts, 'tipo');
    const total = byTipo.reduce((s, r) => s + r.value, 0);
    assert.equal(total, acts.length);
  });

  test('upcoming excluye actividades completadas y ordena por fecha de fin', () => {
    const list = upcoming(acts, 100);
    assert.ok(list.every((a) => a.estado_efectivo !== 'Completada'));
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].fecha_fin <= list[i].fecha_fin);
  });

  test('reportsOf devuelve del más reciente al más antiguo', () => {
    const history = reportsOf(SEED.reports, 3);
    assert.equal(history.length, 2);
    assert.equal(history[0].fecha_reporte, '2026-09-18');
  });

  test('trendSeries produce series de igual longitud y "real" nulo en meses futuros', () => {
    const trend = trendSeries(acts, SEED.reports, today);
    assert.equal(trend.labels.length, trend.planned.length);
    assert.equal(trend.labels.length, trend.real.length);
    assert.equal(trend.real[trend.real.length - 1], null); // el plan llega hasta diciembre; septiembre es "hoy"
  });
});
