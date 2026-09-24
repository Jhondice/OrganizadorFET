import { icon } from '../ui/icons.js';
import { esc, statusBadge, emptyState } from '../ui/render-helpers.js';
import { decorate } from '../domain/stats.js';
import { STATUSES } from '../domain/constants.js';
import { todayISO } from '../utils/dates.js';
import { toCsv, downloadFile } from '../utils/csv.js';
import { state } from '../state/store.js';
import { toast } from '../ui/toast.js';

const criteria = { tipo: 'ALL', responsable: 'ALL', estado: 'ALL' };

function apply() {
  const acts = decorate(state.activities, todayISO());
  return acts
    .filter((a) => criteria.tipo === 'ALL' || a.tipo === criteria.tipo)
    .filter((a) => criteria.responsable === 'ALL' || a.responsable === criteria.responsable)
    .filter((a) => criteria.estado === 'ALL' || a.estado_efectivo === criteria.estado)
    .sort((a, b) => a.periodo.localeCompare(b.periodo) || a.numero - b.numero);
}

export function render() {
  const cat = state.catalogs;
  return `
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6 flex items-center gap-3 border-b pb-4">
        <div class="rounded-xl bg-fet-green p-3 text-white">${icon('sliders', 'w-6 h-6')}</div>
        <div><h2 class="text-lg font-bold text-slate-800">Generador de reportes institucionales</h2><p class="text-xs text-slate-500">Configure los criterios para consolidar y exportar la información del plan docente</p></div>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div><label class="mb-1 block font-bold text-slate-700">Tipo de actividad:</label>
          <select data-role="tipo" class="w-full rounded border border-slate-300 p-2 font-medium"><option value="ALL">Todos los tipos</option>${cat.tipo.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select></div>
        <div><label class="mb-1 block font-bold text-slate-700">Responsable:</label>
          <select data-role="responsable" class="w-full rounded border border-slate-300 p-2 font-medium"><option value="ALL">Todos los responsables</option>${cat.responsable.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select></div>
        <div><label class="mb-1 block font-bold text-slate-700">Estado de avance:</label>
          <select data-role="estado" class="w-full rounded border border-slate-300 p-2 font-medium"><option value="ALL">Todos los estados</option>${STATUSES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></div>
        <div class="flex items-end gap-2">
          <button data-role="export" class="flex w-full items-center justify-center gap-1 rounded bg-fet-green p-2 font-bold text-white shadow-sm hover:bg-fet-darkgreen">${icon('file-spreadsheet', 'w-3.5 h-3.5')} Excel / CSV</button>
          <button data-role="print" class="flex w-full items-center justify-center gap-1 rounded bg-slate-800 p-2 font-bold text-white shadow-sm hover:bg-slate-900">${icon('printer', 'w-3.5 h-3.5')} Imprimir</button>
        </div>
      </div>

      <h3 class="mb-3 text-xs font-bold uppercase text-slate-700">Vista previa del reporte consolidado</h3>
      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-800 text-[10px] font-semibold uppercase text-white"><tr>
            <th class="p-2.5 text-center">N°</th><th class="p-2.5">Actividad</th><th class="p-2.5">Tipo</th><th class="p-2.5">Responsable</th><th class="p-2.5 text-center">% Avance</th><th class="p-2.5 text-center">Estado</th>
          </tr></thead>
          <tbody data-role="tbody" class="divide-y divide-slate-200"></tbody>
        </table>
      </div>
    </div>`;
}

export function mount(root) {
  const tbody = root.querySelector('[data-role="tbody"]');
  function paint() {
    const rows = apply();
    tbody.innerHTML = rows.length
      ? rows.map((a) => `<tr class="hover:bg-slate-50"><td class="p-2.5 text-center font-bold text-slate-600">${a.numero}</td><td class="p-2.5 font-semibold text-slate-800">${esc(a.nombre)}</td><td class="p-2.5 text-slate-600">${esc(a.tipo)}</td><td class="p-2.5 text-slate-600">${esc(a.responsable)}</td><td class="p-2.5 text-center font-bold text-fet-green">${a.avance}%</td><td class="p-2.5 text-center">${statusBadge(a.estado_efectivo)}</td></tr>`).join('')
      : `<tr><td colspan="6">${emptyState('Ningún resultado coincide con los criterios seleccionados.', icon('inbox', 'w-8 h-8 mb-1'))}</td></tr>`;
  }
  ['tipo', 'responsable', 'estado'].forEach((k) => root.querySelector(`[data-role="${k}"]`).addEventListener('change', (e) => { criteria[k] = e.target.value; paint(); }));
  root.querySelector('[data-role="print"]').addEventListener('click', () => window.print());
  root.querySelector('[data-role="export"]').addEventListener('click', () => {
    const csv = toCsv(apply(), [
      { label: 'N°', key: 'numero' }, { label: 'Actividad', key: 'nombre' }, { label: 'Tipo', key: 'tipo' },
      { label: 'Responsable', key: 'responsable' }, { label: '% Avance', key: 'avance' }, { label: 'Estado', key: 'estado_efectivo' },
    ]);
    downloadFile('Reporte_Institucional_FET.csv', csv);
    toast('Reporte exportado a CSV.', 'success');
  });
  paint();
}
