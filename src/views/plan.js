import { icon } from '../ui/icons.js';
import { esc, statusBadge, emptyState } from '../ui/render-helpers.js';
import { decorate } from '../domain/stats.js';
import { PLANS, planOf, STATUSES } from '../domain/constants.js';
import { formatDate, todayISO } from '../utils/dates.js';
import { toCsv, downloadFile } from '../utils/csv.js';
import { state, isReadOnly, createActivity, updateActivity, deleteActivity } from '../state/store.js';
import { openActivityModal } from '../ui/activityModal.js';
import { openActivityDetailsModal } from '../ui/activityDetailsModal.js';
import { confirmDialog } from '../ui/confirm.js';
import { toast } from '../ui/toast.js';
import { ApiError } from '../api/errors.js';

const ALL_FILTER = 'TODOS';
const ACTIVE_FILTER = 'ACTIVAS';
const HISTORY_FILTER = 'HISTORIAL';
const filter = { q: '', tipo: 'TODOS', estado: ACTIVE_FILTER, periodo: 'TODOS' };

function filtered(plan = PLANS.DOCENTE) {
  const acts = decorate(state.activities.filter((activity) => planOf(activity) === plan), todayISO());
  const q = filter.q.trim().toLowerCase();
  return acts
    .filter((a) => !q || a.nombre.toLowerCase().includes(q) || a.responsable.toLowerCase().includes(q))
    .filter((a) => filter.tipo === 'TODOS' || a.tipo === filter.tipo)
    .filter((a) => {
      if (filter.estado === ALL_FILTER) return true;
      if (filter.estado === HISTORY_FILTER) return a.estado_efectivo === 'Completada';
      if (filter.estado === ACTIVE_FILTER) return a.estado_efectivo !== 'Completada';
      return a.estado_efectivo === filter.estado;
    })
    .filter((a) => filter.periodo === 'TODOS' || a.periodo === filter.periodo)
    .sort((a, b) => a.periodo.localeCompare(b.periodo) || a.numero - b.numero);
}

function compactProgressBar(value) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div title="Avance: ${progress}%" class="flex items-center justify-center gap-1"><div class="h-1.5 w-8 overflow-hidden rounded-full bg-slate-200"><div class="h-full bg-fet-green" style="width:${progress}%"></div></div><span class="text-[10px] font-bold text-slate-700">${progress}%</span></div>`;
}

function rowHtml(a, readOnly) {
  return `
    <tr class="border-b border-slate-100 hover:bg-slate-50" data-row="${a.id}">
      <td class="border-r border-slate-100 px-3 py-2.5 text-center font-bold text-slate-600">${a.numero}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 font-semibold text-slate-800">${esc(a.nombre)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-slate-600">${esc(a.linea)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-slate-600">${esc(a.tipo)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-slate-600">${esc(a.responsable)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-slate-500">${formatDate(a.fecha_inicio)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-slate-500">${formatDate(a.fecha_fin)}</td>
      <td class="border-r border-slate-100 px-2 py-2.5 text-center">${compactProgressBar(a.avance)}</td>
      <td class="border-r border-slate-100 px-3 py-2.5 text-center">${statusBadge(a.estado_efectivo)}</td>
      <td class="border-r border-slate-100 max-w-xs truncate px-3 py-2.5 italic text-slate-500">${esc(a.observaciones) || '-'}</td>
      <td class="px-2 py-2.5 text-center">
        <div class="flex items-center justify-center gap-0.5">
          <button data-view="${a.id}" title="Ver detalles" aria-label="Ver detalles de ${esc(a.nombre)}" class="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100">${icon('search', 'w-3.5 h-3.5')}</button>
          ${readOnly ? '' : `
          <button data-edit="${a.id}" title="Editar" class="grid h-7 w-7 place-items-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-100">${icon('edit-3', 'w-3.5 h-3.5')}</button>
          <button data-delete="${a.id}" title="Eliminar" class="grid h-7 w-7 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-100">${icon('trash-2', 'w-3.5 h-3.5')}</button>
          `}
        </div>
      </td>
    </tr>`;
}

export function render(plan = PLANS.DOCENTE) {
  const cat = state.catalogs;
  const readOnly = isReadOnly();
  const title = plan === PLANS.ESPECIALIZACION ? 'Plan de actividades de especialización' : 'ING Software';
  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center">
          <h2 class="w-full text-sm font-bold text-slate-700 lg:w-auto">${title}</h2>
          <div class="relative w-full min-w-0 lg:min-w-[220px] lg:flex-grow">
            <span class="pointer-events-none absolute left-2.5 top-2.5 text-slate-400">${icon('search', 'w-4 h-4')}</span>
            <input data-role="q" type="text" placeholder="Buscar actividad o responsable..." class="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-fet-green">
          </div>
          <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center xl:gap-2">
            <select data-role="periodo" class="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-fet-green xl:w-auto">
              <option value="TODOS">Todos los periodos</option>${cat.periodo.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
            </select>
            <select data-role="tipo" class="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-fet-green xl:w-auto">
              <option value="TODOS">Todos los tipos</option>${cat.tipo.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
            </select>
            <select data-role="estado" class="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-fet-green xl:w-auto">
              <option value="${ALL_FILTER}">Todos los estados</option>
              <option value="${ACTIVE_FILTER}">Actividades activas</option>
              <option value="${HISTORY_FILTER}">Completadas</option>
              ${STATUSES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="flex w-full items-center justify-end gap-2 lg:w-auto">
          <button data-role="export" class="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">${icon('download', 'w-3.5 h-3.5')} Exportar CSV</button>
          ${readOnly ? '' : `<button data-role="new" class="flex items-center gap-1.5 rounded-lg bg-fet-green px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-fet-darkgreen">${icon('plus-circle', 'w-4 h-4')} Nueva actividad</button>`}
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] table-fixed border-collapse text-left text-xs break-words">
            <colgroup>
              <col style="width:4%"><col style="width:18%"><col style="width:11%"><col style="width:8%"><col style="width:9%">
              <col style="width:8%"><col style="width:8%"><col style="width:7%"><col style="width:8%"><col style="width:12%"><col style="width:7%">
            </colgroup>
            <thead><tr class="bg-fet-green text-[11px] font-semibold uppercase tracking-wider text-white">
              <th class="border-r border-emerald-700 px-3 py-3 text-center">N°</th>
              <th class="border-r border-emerald-700 px-3 py-3">Actividad</th>
              <th class="border-r border-emerald-700 px-3 py-3">Línea estratégica</th>
              <th class="border-r border-emerald-700 px-3 py-3">Tipo</th>
              <th class="border-r border-emerald-700 px-3 py-3">Responsable</th>
              <th class="border-r border-emerald-700 px-3 py-3">Fecha inicio</th>
              <th class="border-r border-emerald-700 px-3 py-3">Fecha fin</th>
              <th class="border-r border-emerald-700 px-3 py-3 text-center">% Avance</th>
              <th class="border-r border-emerald-700 px-3 py-3 text-center">Estado</th>
              <th class="border-r border-emerald-700 px-3 py-3">Observaciones</th>
              <th class="px-3 py-3 text-center">Acciones</th>
            </tr></thead>
            <tbody data-role="tbody" class="divide-y divide-slate-200"></tbody>
          </table>
        </div>
      </div>
    </div>`;
}

export function mount(root, plan = PLANS.DOCENTE) {
  const readOnly = isReadOnly();
  const tbody = root.querySelector('[data-role="tbody"]');
  root.querySelector('[data-role="estado"]').value = filter.estado;

  function paint() {
    const rows = filtered(plan);
    tbody.innerHTML = rows.length
      ? rows.map((a) => rowHtml(a, readOnly)).join('')
      : `<tr><td colspan="11">${emptyState(filter.estado === HISTORY_FILTER ? 'No hay actividades terminadas en el historial.' : 'No hay actividades que coincidan con los filtros.', icon('inbox', 'w-8 h-8 mb-1'))}</td></tr>`;
  }

  root.querySelector('[data-role="q"]').addEventListener('input', (e) => { filter.q = e.target.value; paint(); });
  root.querySelector('[data-role="tipo"]').addEventListener('change', (e) => { filter.tipo = e.target.value; paint(); });
  root.querySelector('[data-role="estado"]').addEventListener('change', (e) => { filter.estado = e.target.value; paint(); });
  root.querySelector('[data-role="periodo"]').addEventListener('change', (e) => { filter.periodo = e.target.value; paint(); });

  root.querySelector('[data-role="export"]').addEventListener('click', () => {
    const csv = toCsv(filtered(), [
      { label: 'N°', key: 'numero' }, { label: 'Actividad', key: 'nombre' }, { label: 'Línea estratégica', key: 'linea' },
      { label: 'Tipo', key: 'tipo' }, { label: 'Responsable', key: 'responsable' },
      { label: 'Fecha inicio', value: (a) => formatDate(a.fecha_inicio) }, { label: 'Fecha fin', value: (a) => formatDate(a.fecha_fin) },
      { label: '% Avance', key: 'avance' }, { label: 'Estado', key: 'estado_efectivo' }, { label: 'Observaciones', key: 'observaciones' },
    ]);
    downloadFile(`Plan_de_Actividades_${filter.periodo === 'TODOS' ? 'todos' : filter.periodo}.csv`, csv);
    toast('Archivo CSV generado.', 'success');
  });

  const newBtn = root.querySelector('[data-role="new"]');
  if (newBtn) newBtn.addEventListener('click', () => openActivityModal({ catalogs: state.catalogs, onSubmit: (payload) => createActivity({ ...payload, plan }) }));

  tbody.addEventListener('click', async (e) => {
    const viewId = e.target.closest('[data-view]')?.dataset.view;
    const editId = e.target.closest('[data-edit]')?.dataset.edit;
    const delId = e.target.closest('[data-delete]')?.dataset.delete;
    if (viewId) {
      const activity = state.activities.find((a) => a.id === Number(viewId));
      if (activity) {
        const decorated = decorate([activity], todayISO())[0];
        openActivityDetailsModal(decorated, state.reports);
      }
      return;
    }
    if (editId) {
      const activity = state.activities.find((a) => a.id === Number(editId));
      if (activity) openActivityModal({ activity, catalogs: state.catalogs, onSubmit: (payload) => updateActivity(activity.id, { ...payload, plan }) });
    }
    if (delId) {
      const activity = state.activities.find((a) => a.id === Number(delId));
      if (!activity) return;
      const ok = await confirmDialog({ title: 'Eliminar actividad', message: `¿Eliminar la actividad #${activity.numero} "${activity.nombre}"? También se eliminarán sus informes de avance. Esta acción no se puede deshacer.` });
      if (!ok) return;
      try {
        await deleteActivity(activity.id);
        toast('Actividad eliminada.', 'success');
        paint();
      } catch (err) {
        toast(err instanceof ApiError ? err.message : 'No fue posible eliminar la actividad.', 'error');
      }
    }
  });

  paint();
}
