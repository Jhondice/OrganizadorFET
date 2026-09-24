import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createGasEnv } from './helpers/gas-mock.mjs';

function setup(opts) {
  const env = createGasEnv(opts);
  env.run('setup()');
  return env;
}

describe('backend/Code.gs — instalación y autenticación', () => {
  test('setup() crea las hojas y genera tokens', () => {
    const env = setup();
    assert.ok(env.ss.getSheetByName('Actividades'));
    assert.ok(env.ss.getSheetByName('Informes'));
    assert.ok(env.ss.getSheetByName('Catalogos'));
    assert.ok(env.props.get('ADMIN_TOKEN').length >= 16);
    assert.ok(env.props.get('VIEWER_TOKEN').length >= 16);
    assert.notEqual(env.props.get('ADMIN_TOKEN'), env.props.get('VIEWER_TOKEN'));
  });

  test('rechaza un token inválido', () => {
    const env = setup();
    const res = env.call('bootstrap', {}, 'token-invalido-cualquiera');
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'UNAUTHORIZED');
  });

  test('el rol viewer no puede escribir', () => {
    const env = setup();
    const res = env.call('createActivity', { periodo: '2026-2', nombre: 'X', tipo: 'Académica', linea: 'Docencia', responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-02', avance: 0, estado: 'Programada' }, env.props.get('VIEWER_TOKEN'));
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'FORBIDDEN');
  });

  test('el rol viewer sí puede leer', () => {
    const env = setup();
    const res = env.call('bootstrap', {}, env.props.get('VIEWER_TOKEN'));
    assert.equal(res.ok, true);
    assert.equal(res.data.role, 'viewer');
  });

  test('sin setup(), responde NOT_SETUP', () => {
    const env = createGasEnv();
    const res = env.call('ping', {}, 'x'.repeat(20));
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'NOT_SETUP');
  });
});

describe('backend/Code.gs — CRUD de actividades', () => {
  const activity = () => ({ periodo: '2026-2', nombre: 'Actividad de prueba', tipo: 'Académica', linea: 'Docencia', responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-10', avance: 20, estado: 'En desarrollo', observaciones: 'obs' });

  test('crea, edita y elimina una actividad', () => {
    const env = setup();
    const created = env.call('createActivity', activity());
    assert.equal(created.ok, true);
    assert.equal(created.data.activity.numero, 1);
    const id = created.data.activity.id;

    const updated = env.call('updateActivity', { id, avance: 55, estado: 'En desarrollo' });
    assert.equal(updated.ok, true);
    assert.equal(updated.data.activity.avance, 55);

    const del = env.call('deleteActivity', { id });
    assert.equal(del.ok, true);

    const boot = env.call('bootstrap');
    assert.equal(boot.data.activities.length, 0);
  });

  test('rechaza datos inválidos con VALIDATION y detalle por campo', () => {
    const env = setup();
    const res = env.call('createActivity', { ...activity(), nombre: '' });
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'VALIDATION');
    assert.ok(res.error.fields.nombre);
  });

  test('rechaza un tipo que no existe en el catálogo', () => {
    const env = setup();
    const res = env.call('createActivity', { ...activity(), tipo: 'Inexistente' });
    assert.equal(res.ok, false);
    assert.ok(res.error.fields.tipo);
  });

  test('numera correlativamente por periodo', () => {
    const env = setup();
    env.call('createActivity', { ...activity(), periodo: '2026-2' });
    const b = env.call('createActivity', { ...activity(), periodo: '2026-2' });
    const c = env.call('createActivity', { ...activity(), periodo: '2026-1' });
    assert.equal(b.data.activity.numero, 2);
    assert.equal(c.data.activity.numero, 1); // otro periodo, reinicia
  });

  test('el estado Completada fuerza el avance a 100 (regla del servidor)', () => {
    const env = setup();
    const created = env.call('createActivity', { ...activity(), avance: 40, estado: 'Completada' });
    assert.equal(created.data.activity.avance, 100);
  });

  test('eliminar una actividad elimina también sus informes', () => {
    const env = setup();
    const created = env.call('createActivity', activity());
    const id = created.data.activity.id;
    env.call('saveReport', { actividad_id: id, fecha_reporte: '2026-08-05', avance_realizado: 'Avance parcial', porcentaje: 30, estado: 'En desarrollo' });
    const del = env.call('deleteActivity', { id });
    assert.equal(del.data.deletedReports, 1);
    const boot = env.call('bootstrap');
    assert.equal(boot.data.reports.length, 0);
  });

  test('un responsable nuevo se agrega automáticamente al catálogo', () => {
    const env = setup();
    env.call('createActivity', { ...activity(), responsable: 'Nuevo Responsable' });
    const cats = env.call('bootstrap').data.catalogs;
    assert.ok(cats.responsable.includes('Nuevo Responsable'));
  });
});

describe('backend/Code.gs — informes', () => {
  test('guardar un informe actualiza el avance y estado de la actividad', () => {
    const env = setup();
    const id = env.call('createActivity', { periodo: '2026-2', nombre: 'A', tipo: 'Académica', linea: 'Docencia', responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-20', avance: 0, estado: 'Programada' }).data.activity.id;
    const res = env.call('saveReport', { actividad_id: id, fecha_reporte: '2026-08-10', avance_realizado: 'Se avanzó bien', porcentaje: 65, estado: 'En desarrollo' });
    assert.equal(res.ok, true);
    assert.equal(res.data.activity.avance, 65);
    assert.equal(res.data.activity.estado, 'En desarrollo');
  });

  test('rechaza un informe para una actividad inexistente', () => {
    const env = setup();
    const res = env.call('saveReport', { actividad_id: 9999, fecha_reporte: '2026-08-10', avance_realizado: 'x', porcentaje: 10, estado: 'Pendiente' });
    assert.equal(res.ok, false);
    assert.equal(res.error.code, 'NOT_FOUND');
  });
});

describe('backend/Code.gs — catálogos', () => {
  test('agrega y elimina un valor de catálogo', () => {
    const env = setup();
    const add = env.call('addCatalogItem', { catalogo: 'tipo', valor: 'Extensión cultural' });
    assert.ok(add.data.catalogs.tipo.includes('Extensión cultural'));
    const del = env.call('deleteCatalogItem', { catalogo: 'tipo', valor: 'Extensión cultural' });
    assert.equal(del.ok, true);
  });

  test('no permite eliminar un valor de catálogo en uso', () => {
    const env = setup();
    env.call('createActivity', { periodo: '2026-2', nombre: 'A', tipo: 'Académica', linea: 'Docencia', responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-02', avance: 0, estado: 'Programada' });
    const del = env.call('deleteCatalogItem', { catalogo: 'tipo', valor: 'Académica' });
    assert.equal(del.ok, false);
    assert.equal(del.error.code, 'CONFLICT');
  });
});

describe('backend/Code.gs — datos de ejemplo', () => {
  test('seedDemoData() carga el mismo conjunto que src/data/seed.js', () => {
    const env = setup({ withSeed: true });
    env.run('seedDemoData()');
    const boot = env.call('bootstrap');
    assert.equal(boot.data.activities.length, 10);
    assert.equal(boot.data.reports.length, 10);
  });

  test('celdas guardadas como texto neutralizan una fórmula maliciosa', () => {
    const env = setup();
    env.call('createActivity', { periodo: '2026-2', nombre: '=HYPERLINK("http://x")', tipo: 'Académica', linea: 'Docencia', responsable: 'Docente', fecha_inicio: '2026-08-01', fecha_fin: '2026-08-02', avance: 0, estado: 'Programada' });
    const cellValue = env.ss.getSheetByName('Actividades').getRange(2, 4).getValues()[0][0];
    assert.equal(cellValue, '=HYPERLINK("http://x")'); // se guarda como texto literal, no se evalúa
  });
});
