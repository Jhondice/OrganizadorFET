import { icon } from './icons.js';
import { esc, statusBadge } from './render-helpers.js';
import { reportsOf } from '../domain/stats.js';
import { formatDate } from '../utils/dates.js';

function detail(label, value) {
  return `<div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <dt class="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">${label}</dt>
    <dd class="whitespace-pre-wrap break-words text-xs font-medium text-slate-700">${value || '—'}</dd>
  </div>`;
}

export function openActivityDetailsModal(activity, reports = []) {
  const root = document.getElementById('modal-root');
  const history = reportsOf(reports, activity.id);
  const reportDetails = (label, value) => detail(label, esc(value));

  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4" data-role="backdrop">
      <section class="my-6 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="activity-details-title">
        <header class="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-fet-green px-5 py-4 text-white">
          <div class="flex min-w-0 items-center gap-3">
            ${icon('search', 'h-5 w-5 shrink-0')}
            <div class="min-w-0">
              <h2 id="activity-details-title" class="text-base font-bold">Actividad #${esc(activity.numero)}</h2>
              <p class="truncate text-xs text-white/80">${esc(activity.nombre)}</p>
            </div>
          </div>
          <button type="button" data-role="close" aria-label="Cerrar detalles" class="ml-3 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white">${icon('x', 'h-5 w-5')}</button>
        </header>

        <div class="space-y-5 p-5">
          <section aria-labelledby="activity-data-heading">
            <h3 id="activity-data-heading" class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Información de la actividad</h3>
            <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              ${detail('Nombre', esc(activity.nombre))}
              ${detail('Identificador', esc(activity.id))}
              ${detail('Periodo', esc(activity.periodo))}
              ${detail('Número', esc(activity.numero))}
              ${detail('Tipo', esc(activity.tipo))}
              ${detail('Línea estratégica', esc(activity.linea))}
              ${detail('Responsable', esc(activity.responsable))}
              ${detail('Fecha de inicio', esc(formatDate(activity.fecha_inicio)))}
              ${detail('Fecha de finalización', esc(formatDate(activity.fecha_fin)))}
              ${detail('Avance', `${esc(activity.avance)}%`)}
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt class="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Estado</dt>
                <dd>${statusBadge(activity.estado_efectivo || activity.estado)}</dd>
              </div>
              ${detail('Observaciones', esc(activity.observaciones))}
              ${detail('Creada', esc(activity.creado))}
              ${detail('Última actualización', esc(activity.actualizado))}
            </dl>
          </section>

          <section aria-labelledby="activity-reports-heading">
            <h3 id="activity-reports-heading" class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Informes de avance (${history.length})</h3>
            ${history.length ? `<div class="space-y-4">${history.map((report) => `
              <article class="rounded-xl border border-slate-200 p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h4 class="text-xs font-bold text-slate-700">${esc(formatDate(report.fecha_reporte))}</h4>
                  <div class="flex items-center gap-2">${statusBadge(report.estado)}<span class="text-xs font-bold text-fet-green">${esc(report.porcentaje)}%</span></div>
                </div>
                <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  ${reportDetails('Identificador', report.id)}
                  ${reportDetails('Porcentaje', report.porcentaje)}
                  ${reportDetails('Estado', report.estado)}
                  ${reportDetails('Responsable', report.responsable)}
                  ${reportDetails('Observaciones', report.observaciones)}
                  ${reportDetails('Fecha del informe', formatDate(report.fecha_reporte))}
                </dl>
              </article>
            `).join('')}</div>` : '<p class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">No hay informes de avance registrados para esta actividad.</p>'}
          </section>
        </div>

        <footer class="flex justify-end border-t border-slate-100 px-5 py-4">
          <button type="button" data-role="close" class="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cerrar</button>
        </footer>
      </section>
    </div>
  `;

  root.querySelectorAll('[data-role="close"]').forEach((button) => {
    button.addEventListener('click', () => { root.innerHTML = ''; });
  });
}
