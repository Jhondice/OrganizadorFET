// Cliente en modo demostración: implementa el MISMO contrato de acciones que el backend real
// (backend/Code.gs) pero guarda todo en localStorage. Permite usar la aplicación completa
// -crear, editar, eliminar, informes, catálogos- sin ninguna cuenta de Google. Los datos quedan
// solo en el navegador de quien los crea: no se comparten entre personas ni dispositivos.
import { ApiError } from './errors.js';
import { SEED } from '../data/seed.js';
import { validateActivity, validateReport } from '../domain/validation.js';
import { CATALOG_KEYS } from '../domain/constants.js';

const KEY = 'fet.seguimiento.demo.v1';
const LATENCY_MS = 120;

function seedDb() {
  return {
    activities: SEED.activities.map((a) => ({ ...a })),
    reports: SEED.reports.map((r) => ({ ...r })),
    catalogs: JSON.parse(JSON.stringify(SEED.catalogs)),
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* localStorage no disponible o dato corrupto: se reinicia */ }
  const db = seedDb();
  persist(db);
  return db;
}

function persist(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* cuota agotada o modo privado */ }
}

export function resetDemoData() {
  try { localStorage.removeItem(KEY); } catch { /* no-op */ }
}

const wait = () => new Promise((r) => setTimeout(r, LATENCY_MS));
const nowIso = () => new Date().toISOString();
const nextId = (list) => list.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
const nextNumero = (acts, periodo) => acts.filter((a) => a.periodo === periodo).reduce((m, a) => Math.max(m, a.numero || 0), 0) + 1;
const hasValue = (list, value) => (list || []).some((x) => String(x).toLowerCase() === String(value).toLowerCase());

export function createLocalClient() {
  const db = loadDb();

  function findActivity(id) {
    const act = db.activities.find((a) => a.id === Number(id));
    if (!act) throw new ApiError('NOT_FOUND', `No se encontró la actividad #${id}.`);
    return act;
  }

  const handlers = {
    ping: async () => ({ pong: true, version: 'demo', role: 'admin' }),

    bootstrap: async () => ({
      role: 'admin',
      version: 'demo',
      serverTime: nowIso(),
      activities: db.activities.map((a) => ({ ...a })),
      reports: db.reports.map((r) => ({ ...r })),
      catalogs: JSON.parse(JSON.stringify(db.catalogs)),
    }),

    createActivity: async (p) => {
      const result = validateActivity(p, db.catalogs);
      if (!result.ok) throw new ApiError('VALIDATION', 'Revise los campos marcados.', result.errors);
      const ts = nowIso();
      const rec = { id: nextId(db.activities), numero: nextNumero(db.activities, result.value.periodo), ...result.value, creado: ts, actualizado: ts };
      db.activities.push(rec);
      if (!hasValue(db.catalogs.responsable, rec.responsable)) db.catalogs.responsable.push(rec.responsable);
      persist(db);
      return { activity: rec };
    },

    updateActivity: async (p) => {
      const existing = findActivity(p.id);
      const merged = { ...existing, ...p };
      const result = validateActivity(merged, db.catalogs);
      if (!result.ok) throw new ApiError('VALIDATION', 'Revise los campos marcados.', result.errors);
      const rec = { ...existing, ...result.value, actualizado: nowIso() };
      if (result.value.periodo !== existing.periodo) rec.numero = nextNumero(db.activities.filter((a) => a.id !== existing.id), result.value.periodo);
      Object.assign(existing, rec);
      if (!hasValue(db.catalogs.responsable, rec.responsable)) db.catalogs.responsable.push(rec.responsable);
      persist(db);
      return { activity: { ...existing } };
    },

    deleteActivity: async (p) => {
      const id = Number(p.id);
      const idx = db.activities.findIndex((a) => a.id === id);
      if (idx === -1) throw new ApiError('NOT_FOUND', `No se encontró la actividad #${id}.`);
      db.activities.splice(idx, 1);
      const before = db.reports.length;
      db.reports = db.reports.filter((r) => r.actividad_id !== id);
      persist(db);
      return { id, deletedReports: before - db.reports.length };
    },

    saveReport: async (p) => {
      const result = validateReport(p);
      if (!result.ok) throw new ApiError('VALIDATION', 'Revise los campos marcados.', result.errors);
      const activity = findActivity(result.value.actividad_id);
      const rec = { id: nextId(db.reports), ...result.value, creado: nowIso() };
      db.reports.push(rec);
      Object.assign(activity, { avance: result.value.porcentaje, estado: result.value.estado, actualizado: nowIso() });
      persist(db);
      return { report: rec, activity: { ...activity } };
    },

    deleteReport: async (p) => {
      const id = Number(p.id);
      const idx = db.reports.findIndex((r) => r.id === id);
      if (idx === -1) throw new ApiError('NOT_FOUND', 'El informe no existe.');
      db.reports.splice(idx, 1);
      persist(db);
      return { id };
    },

    addCatalogItem: async (p) => {
      const key = String(p.catalogo || '');
      const value = String(p.valor || '').trim();
      if (!CATALOG_KEYS.includes(key)) throw new ApiError('VALIDATION', 'Catálogo no válido.');
      if (!value) throw new ApiError('VALIDATION', 'El valor es obligatorio.', { valor: 'El valor es obligatorio.' });
      if (hasValue(db.catalogs[key], value)) throw new ApiError('CONFLICT', `"${value}" ya existe en este catálogo.`);
      db.catalogs[key].push(value);
      persist(db);
      return { catalogs: JSON.parse(JSON.stringify(db.catalogs)) };
    },

    deleteCatalogItem: async (p) => {
      const key = String(p.catalogo || '');
      const value = String(p.valor || '');
      if (!CATALOG_KEYS.includes(key)) throw new ApiError('VALIDATION', 'Catálogo no válido.');
      const inUse = db.activities.filter((a) => a[key] === value).length;
      if (inUse > 0) throw new ApiError('CONFLICT', `"${value}" está en uso por ${inUse} actividad(es). Reasígnelas antes de eliminarlo.`);
      db.catalogs[key] = db.catalogs[key].filter((x) => x !== value);
      persist(db);
      return { catalogs: JSON.parse(JSON.stringify(db.catalogs)) };
    },
  };

  async function call(action, payload = {}) {
    await wait();
    const fn = handlers[action];
    if (!fn) throw new ApiError('NOT_FOUND', `Acción no reconocida: ${action}`);
    return fn(payload);
  }

  return { kind: 'local', call };
}
