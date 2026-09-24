import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateActivity, validateReport, normalizeActivity } from '../src/domain/validation.js';
import { SEED } from '../src/data/seed.js';

const validAct = () => ({
  periodo: '2026-2', nombre: 'Actividad de prueba', tipo: 'Académica', linea: 'Docencia',
  responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-10', avance: 40, estado: 'En desarrollo', observaciones: '',
});

describe('validateActivity', () => {
  test('acepta una actividad válida', () => {
    const r = validateActivity(validAct(), SEED.catalogs);
    assert.equal(r.ok, true);
    assert.deepEqual(r.errors, {});
  });

  test('rechaza nombre vacío', () => {
    const r = validateActivity({ ...validAct(), nombre: '' }, SEED.catalogs);
    assert.equal(r.ok, false);
    assert.ok(r.errors.nombre);
  });

  test('rechaza fecha fin anterior a fecha inicio', () => {
    const r = validateActivity({ ...validAct(), fecha_inicio: '2026-08-10', fecha_fin: '2026-08-01' }, SEED.catalogs);
    assert.equal(r.ok, false);
    assert.ok(r.errors.fecha_fin);
  });

  test('rechaza un avance no numérico', () => {
    const r = validateActivity({ ...validAct(), avance: 'no-es-numero' }, SEED.catalogs);
    assert.equal(r.ok, false);
    assert.ok(r.errors.avance);
  });

  test('el avance fuera de rango se ajusta (clamp) a 0–100, no se rechaza', () => {
    const r = validateActivity({ ...validAct(), avance: 150 }, SEED.catalogs);
    assert.equal(r.ok, true);
    assert.equal(r.value.avance, 100);
  });

  test('rechaza valores de catálogo que no existen', () => {
    const r = validateActivity({ ...validAct(), tipo: 'No existe' }, SEED.catalogs);
    assert.equal(r.ok, false);
    assert.ok(r.errors.tipo);
  });

  test('sin catálogo, no exige pertenencia (sólo validación de formato)', () => {
    const r = validateActivity({ ...validAct(), tipo: 'Cualquiera' });
    assert.equal(r.ok, true);
  });

  test('regla de negocio: Completada fuerza avance a 100', () => {
    const v = normalizeActivity({ ...validAct(), estado: 'Completada', avance: 40 });
    assert.equal(v.avance, 100);
  });

  test('rechaza texto de observaciones demasiado largo', () => {
    const r = validateActivity({ ...validAct(), observaciones: 'x'.repeat(1001) }, SEED.catalogs);
    assert.equal(r.ok, false);
    assert.ok(r.errors.observaciones);
  });
});

describe('validateReport', () => {
  const validRep = () => ({
    actividad_id: 1, fecha_reporte: '2026-08-15', avance_realizado: 'Se avanzó según lo previsto.',
    dificultades: '', resultados: '', acciones_siguientes: '', porcentaje: 60, estado: 'En desarrollo', proxima_revision: '', autor: 'Docente',
  });

  test('acepta un informe válido', () => {
    const r = validateReport(validRep());
    assert.equal(r.ok, true);
  });

  test('exige describir el avance', () => {
    const r = validateReport({ ...validRep(), avance_realizado: '' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.avance_realizado);
  });

  test('exige seleccionar una actividad', () => {
    const r = validateReport({ ...validRep(), actividad_id: 0 });
    assert.equal(r.ok, false);
    assert.ok(r.errors.actividad_id);
  });

  test('rechaza fecha de próxima revisión inválida', () => {
    const r = validateReport({ ...validRep(), proxima_revision: '31/12/2026' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.proxima_revision);
  });

  test('Completada fuerza porcentaje a 100', () => {
    const r = validateReport({ ...validRep(), estado: 'Completada', porcentaje: 10 });
    assert.equal(r.value.porcentaje, 100);
  });
});
