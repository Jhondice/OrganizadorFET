import { icon } from '../ui/icons.js';
import { esc, statusBadge, emptyState } from '../ui/render-helpers.js';
import { reportsOf } from '../domain/stats.js';
import { formatDate } from '../utils/dates.js';
import { state, isReadOnly, saveReport } from '../state/store.js';
import { openReportModal } from '../ui/reportModal.js';

let selectedId = null;

function activities() {
  return [...state.activities].sort((a, b) => a.periodo.localeCompare(b.periodo) || a.numero - b.numero);
}

export function render() {
  const acts = activities();
  if (!selectedId && acts.length) selectedId = acts[0].id;
  const activity = acts.find((a) => a.id === selectedId);
  const history = activity ? reportsOf(state.reports, activity.id) : [];

  return `
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-fet-green p-3 text-white">${icon('file-check-2', 'w-6 h-6')}</div>
            <div>
              <h2 class="text-lg font-bold text-slate-800">Informes de avance</h2>
              <p class="text-xs text-slate-500">Historial de seguimiento por actividad del plan de trabajo docente</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${isReadOnly() || !activity ? '' : `<button data-role="new" class="flex items-center gap-1.5 rounded-lg bg-fet-green px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-fet-darkgreen">${icon('plus', 'w-4 h-4')} Nuevo informe</button>`}
            <button data-role="print" class="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-900">${icon('printer', 'w-4 h-4')} Imprimir</button>
          </div>
        </div>

        <div class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label class="mb-2 block text-xs font-bold text-slate-700">Seleccionar actividad:</label>
          <select data-role="select-act" class="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold focus:ring-2 focus:ring-fet-green">
            ${acts.map((a) => `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>#${a.numero} · ${esc(a.nombre)} (${esc(a.estado)})</option>`).join('')}
          </select>
        </div>

        ${!activity ? emptyState('No hay actividades registradas todavía.', icon('inbox', 'w-8 h-8 mb-1')) : `
        <div id="print-area" class="space-y-4 rounded-xl border border-slate-300 bg-white p-6 shadow-inner">
          <div class="flex items-center justify-between border-b-2 border-fet-green pb-4">
            <div class="flex items-center gap-3">
              <div class="rounded bg-fet-green px-3 py-1 text-lg font-black text-white">FET</div>
              <div>
                <h3 class="text-sm font-bold text-slate-800">FUNDACIÓN ESCUELA TECNOLÓGICA DE NEIVA "JESÚS OVIEDO PÉREZ"</h3>
                <p class="text-xs text-slate-500">FORMATO DE SEGUIMIENTO Y CONTROL — INFORME DE ACTIVIDAD</p>
              </div>
            </div>
            <span class="rounded-full border border-yellow-300 bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">Periodo ${esc(activity.periodo)}</span>
          </div>

          <div class="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs lg:grid-cols-4">
            <div><span class="block text-[10px] uppercase text-slate-400">Número</span><span class="text-sm font-bold text-slate-800">#${activity.numero}</span></div>
            <div><span class="block text-[10px] uppercase text-slate-400">Tipo</span><span class="font-bold text-slate-800">${esc(activity.tipo)}</span></div>
            <div><span class="block text-[10px] uppercase text-slate-400">Responsable</span><span class="font-bold text-slate-800">${esc(activity.responsable)}</span></div>
            <div><span class="block text-[10px] uppercase text-slate-400">Estado actual</span>${statusBadge(activity.estado)}</div>
          </div>

          <div><h4 class="mb-1 text-xs font-bold uppercase text-slate-500">Título de la actividad</h4><div class="rounded-lg border bg-slate-100 p-3 text-xs font-semibold text-slate-800">${esc(activity.nombre)}</div></div>

          <div class="flex items-center justify-between rounded-lg bg-slate-800 p-4 text-xs text-white">
            <div>Porcentaje de cumplimiento: <span class="text-lg font-black text-yellow-400">${activity.avance}%</span></div>
            <div>Última actualización: <span class="font-bold text-slate-200">${formatDate(activity.actualizado?.slice(0, 10))}</span></div>
          </div>

          <h4 class="pt-2 text-xs font-bold uppercase text-slate-500">Historial de informes (${history.length})</h4>
          ${history.length === 0 ? emptyState('Todavía no se han registrado informes para esta actividad.', icon('inbox', 'w-8 h-8 mb-1')) :
            history.map((r) => `
            <div class="space-y-3 rounded-lg border border-slate-200 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span class="text-xs font-bold text-slate-700">${formatDate(r.fecha_reporte)}</span>
                <div class="flex items-center gap-2">${statusBadge(r.estado)}<span class="text-xs font-bold text-fet-green">${r.porcentaje}%</span></div>
              </div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"><h5 class="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800">${icon('check-circle-2', 'w-4 h-4')} Avance realizado</h5><p class="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">${esc(r.avance_realizado) || 'Sin información.'}</p></div>
                <div class="rounded-lg border border-amber-200 bg-amber-50/50 p-3"><h5 class="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-800">${icon('circle-alert', 'w-4 h-4')} Dificultades</h5><p class="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">${esc(r.dificultades) || 'Sin dificultades reportadas.'}</p></div>
                <div class="rounded-lg border border-blue-200 bg-blue-50/50 p-3"><h5 class="mb-1 flex items-center gap-1.5 text-xs font-bold text-blue-800">${icon('award', 'w-4 h-4')} Resultados obtenidos</h5><p class="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">${esc(r.resultados) || 'Resultados en proceso.'}</p></div>
                <div class="rounded-lg border border-purple-200 bg-purple-50/50 p-3"><h5 class="mb-1 flex items-center gap-1.5 text-xs font-bold text-purple-800">${icon('arrow-right-circle', 'w-4 h-4')} Acciones siguientes</h5><p class="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">${esc(r.acciones_siguientes) || 'Continuar según cronograma.'}</p></div>
              </div>
              <p class="text-[11px] text-slate-400">Autor: ${esc(r.autor) || 'No especificado'} ${r.proxima_revision ? `· Próxima revisión: ${formatDate(r.proxima_revision)}` : ''}</p>
            </div>`).join('')}
        </div>`}
      </div>
    </div>`;
}

export function mount(root) {
  const select = root.querySelector('[data-role="select-act"]');
  if (select) select.addEventListener('change', (e) => { selectedId = Number(e.target.value); rerenderInto(root); });

  const printBtn = root.querySelector('[data-role="print"]');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const newBtn = root.querySelector('[data-role="new"]');
  if (newBtn) newBtn.addEventListener('click', () => {
    const activity = state.activities.find((a) => a.id === selectedId);
    if (activity) openReportModal({ activity, onSubmit: (payload) => saveReport(payload) });
  });
}

function rerenderInto(root) {
  root.innerHTML = render();
  mount(root);
}
