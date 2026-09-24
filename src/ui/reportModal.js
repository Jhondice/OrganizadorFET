import { icon } from './icons.js';
import { validateReport } from '../domain/validation.js';
import { STATUSES } from '../domain/constants.js';
import { todayISO } from '../utils/dates.js';
import { ApiError } from '../api/errors.js';
import { toast } from './toast.js';

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function opts(list, current) { return list.map((v) => `<option value="${esc(v)}" ${v === current ? 'selected' : ''}>${esc(v)}</option>`).join(''); }

/** @param {{activity: object, onSubmit: (payload:object)=>Promise<any>}} args */
export function openReportModal({ activity, onSubmit }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto" data-role="backdrop">
      <div class="w-full max-w-xl rounded-2xl bg-white shadow-2xl my-8">
        <div class="flex items-center justify-between rounded-t-2xl bg-fet-green px-6 py-4 text-white">
          <h3 class="flex items-center gap-2 text-base font-bold">${icon('file-edit', 'w-5 h-5')} Nuevo informe · Actividad #${activity.numero}</h3>
          <button type="button" data-role="cancel" class="text-white/80 hover:text-white">${icon('x', 'w-5 h-5')}</button>
        </div>
        <form data-role="form" novalidate class="space-y-4 p-6 text-xs">
          <p class="rounded-lg bg-slate-50 border border-slate-200 p-2.5 font-semibold text-slate-700">${esc(activity.nombre)}</p>
          <input type="hidden" name="actividad_id" value="${activity.id}">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-bold text-slate-700">Fecha de reporte *</label>
              <input type="date" name="fecha_reporte" value="${todayISO()}" class="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-fet-green">
              <p data-err="fecha_reporte" class="mt-1 hidden text-[11px] font-semibold text-rose-600"></p>
            </div>
            <div>
              <label class="mb-1 block font-bold text-slate-700">Autor</label>
              <input name="autor" value="${esc(activity.responsable)}" class="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-fet-green">
            </div>
          </div>
          <div>
            <label class="mb-1 block font-bold text-slate-700">Avance realizado *</label>
            <textarea name="avance_realizado" rows="3" placeholder="Describa el avance alcanzado..." class="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-fet-green"></textarea>
            <p data-err="avance_realizado" class="mt-1 hidden text-[11px] font-semibold text-rose-600"></p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-bold text-slate-700">Dificultades</label>
              <textarea name="dificultades" rows="2" class="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-fet-green"></textarea>
            </div>
            <div>
              <label class="mb-1 block font-bold text-slate-700">Resultados obtenidos</label>
              <textarea name="resultados" rows="2" class="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-fet-green"></textarea>
            </div>
          </div>
          <div>
            <label class="mb-1 block font-bold text-slate-700">Acciones siguientes</label>
            <textarea name="acciones_siguientes" rows="2" class="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-fet-green"></textarea>
          </div>
          <div class="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div class="flex items-center gap-2">
              <label class="font-bold text-slate-700">% Avance actual *</label>
              <input type="number" min="0" max="100" name="porcentaje" value="${activity.avance}" class="w-20 rounded border border-slate-300 p-1.5 text-center font-bold text-fet-green focus:ring-2 focus:ring-fet-green">
            </div>
            <div class="flex items-center gap-2">
              <label class="font-bold text-slate-700">Estado *</label>
              <select name="estado" class="rounded border border-slate-300 p-1.5 font-semibold focus:ring-2 focus:ring-fet-green">${opts(STATUSES, activity.estado)}</select>
            </div>
            <div class="flex items-center gap-2">
              <label class="font-bold text-slate-700">Próxima revisión</label>
              <input type="date" name="proxima_revision" class="rounded border border-slate-300 p-1.5 focus:ring-2 focus:ring-fet-green">
            </div>
          </div>
          <p data-err="porcentaje" class="hidden text-[11px] font-semibold text-rose-600"></p>
          <div class="flex items-center justify-end gap-2 border-t pt-4">
            <button type="button" data-role="cancel" class="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" data-role="submit" class="flex items-center gap-1.5 rounded-lg bg-fet-green px-5 py-2 font-bold text-white shadow-md hover:bg-fet-darkgreen">${icon('save', 'w-4 h-4')} Guardar informe</button>
          </div>
        </form>
      </div>
    </div>`;

  const close = () => { root.innerHTML = ''; };
  root.querySelector('[data-role="cancel"]').addEventListener('click', close);
  root.querySelector('[data-role="backdrop"]').addEventListener('click', (e) => { if (e.target === e.currentTarget) close(); });

  const form = root.querySelector('[data-role="form"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = ''; el.classList.add('hidden'); });
    const local = validateReport(payload);
    if (!local.ok) { showErrors(form, local.errors); return; }

    const btn = form.querySelector('[data-role="submit"]');
    btn.disabled = true;
    try {
      await onSubmit(local.value);
      toast('Informe de avance guardado con éxito.', 'success');
      close();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION' && err.fields) showErrors(form, err.fields);
      else toast(err instanceof ApiError ? err.message : 'No fue posible guardar el informe.', 'error');
      btn.disabled = false;
    }
  });
}

function showErrors(form, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const el = form.querySelector(`[data-err="${field}"]`);
    if (el) { el.textContent = message; el.classList.remove('hidden'); }
  });
}
