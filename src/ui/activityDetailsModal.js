import { icon } from './icons.js';
import { esc, progressBar, statusBadge } from './render-helpers.js';
import { formatDate } from '../utils/dates.js';

/** Muestra la información completa de una actividad sin permitir modificaciones. */
export function openActivityDetailsModal(activity) {
  const root = document.getElementById('modal-root');
  const status = activity.estado_efectivo || activity.estado;

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4" data-role="backdrop">
      <section role="dialog" aria-modal="true" aria-labelledby="activity-details-title" class="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <header class="flex items-center justify-between rounded-t-2xl bg-fet-green px-4 py-4 text-white sm:px-6">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-white/75">Detalle de actividad</p>
            <h3 id="activity-details-title" class="text-base font-bold">Actividad #${esc(activity.numero)}</h3>
          </div>
          <button type="button" data-role="close" aria-label="Cerrar detalle" class="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white">${icon('x', 'w-5 h-5')}</button>
        </header>

        <div class="space-y-5 p-4 text-xs sm:p-6">
          <div>
            <h4 class="text-base font-bold text-slate-800">${esc(activity.nombre)}</h4>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              ${statusBadge(status)}
              <span class="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Periodo ${esc(activity.periodo)}</span>
            </div>
          </div>

          <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Línea estratégica</dt><dd class="mt-1 font-semibold text-slate-700">${esc(activity.linea) || 'Sin información'}</dd></div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tipo</dt><dd class="mt-1 font-semibold text-slate-700">${esc(activity.tipo) || 'Sin información'}</dd></div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Responsable</dt><dd class="mt-1 font-semibold text-slate-700">${esc(activity.responsable) || 'Sin información'}</dd></div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3"><dt class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Fechas</dt><dd class="mt-1 font-semibold text-slate-700">${formatDate(activity.fecha_inicio)} — ${formatDate(activity.fecha_fin)}</dd></div>
          </dl>

          <div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
            <div class="mb-2 flex items-center justify-between"><span class="font-bold text-emerald-800">Avance de la actividad</span><span class="font-black text-fet-green">${Number(activity.avance) || 0}%</span></div>
            ${progressBar(activity.avance)}
          </div>

          <div>
            <h4 class="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Observaciones</h4>
            <p class="min-h-12 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-700">${esc(activity.observaciones) || 'Sin observaciones registradas.'}</p>
          </div>
        </div>

        <footer class="flex justify-end border-t border-slate-100 px-4 py-4 sm:px-6">
          <button type="button" data-role="close" class="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cerrar</button>
        </footer>
      </section>
    </div>`;

  const close = () => {
    root.innerHTML = '';
    document.removeEventListener('keydown', onKeydown);
  };
  const onKeydown = (event) => { if (event.key === 'Escape') close(); };
  root.querySelectorAll('[data-role="close"]').forEach((button) => button.addEventListener('click', close));
  root.querySelector('[data-role="backdrop"]').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) close();
  });
  document.addEventListener('keydown', onKeydown);
}
