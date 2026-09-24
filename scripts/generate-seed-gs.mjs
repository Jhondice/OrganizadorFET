/**
 * Genera backend/Seed.gs a partir de src/data/seed.js (fuente única de datos de ejemplo).
 * Uso: npm run seed:gs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SEED } from '../src/data/seed.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const body = JSON.stringify({ activities: SEED.activities, reports: SEED.reports }, null, 2);

const out = `/**
 * ARCHIVO GENERADO — no editar a mano.
 * Fuente: src/data/seed.js  ·  Regenerar con: npm run seed:gs
 *
 * Datos de ejemplo. Se cargan con la función seedDemoData() (menú "FET Seguimiento")
 * y solo si la hoja "Actividades" está vacía. Este archivo es opcional.
 */
const SEED_ = ${body};
`;

writeFileSync(resolve(root, 'backend/Seed.gs'), out);
console.log(`backend/Seed.gs generado (${SEED.activities.length} actividades, ${SEED.reports.length} informes)`);
