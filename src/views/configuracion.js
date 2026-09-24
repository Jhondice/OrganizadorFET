import { icon } from '../ui/icons.js';
import { esc, emptyState } from '../ui/render-helpers.js';
import { CATALOG_KEYS, CATALOG_LABELS } from '../domain/constants.js';
import { state, isReadOnly, connectRemote, connectLocal, disconnect, addCatalogItem, deleteCatalogItem, describeError, defaultApiUrl } from '../state/store.js';
import { resetDemoData } from '../api/localClient.js';
import { confirmDialog } from '../ui/confirm.js';
import { toast } from '../ui/toast.js';

export function render() {
  const readOnly = isReadOnly();
  const isLocal = state.mode === 'local';

  return `
    <div class="space-y-6">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">${icon(isLocal ? 'cloud-off' : 'cloud', 'w-5 h-5 text-fet-green')} Conexión de datos</h2>

        <div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border p-3 text-xs ${isLocal ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}">
          ${icon(isLocal ? 'triangle-alert' : 'circle-check', 'w-4 h-4 shrink-0')}
          <span class="font-medium">
            ${isLocal
              ? 'Está usando el <b>modo demostración</b>: los datos se guardan solo en este navegador y no se comparten con nadie más.'
              : `Conectado a Google Sheets. Rol de la sesión: <b>${esc(state.role)}</b>${state.role === 'viewer' ? ' (solo lectura)' : ''}.`}
          </span>
        </div>

        ${isLocal ? `
        <form data-role="connect-form" class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px_auto]">
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-700">URL del Web App de Apps Script</label>
            <input name="url" type="url" required value="${esc(defaultApiUrl())}" placeholder="https://script.google.com/macros/s/…/exec" class="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-fet-green">
          </div>
          <div>
            <label class="mb-1 block text-xs font-bold text-slate-700">Token de acceso</label>
            <input name="token" type="password" required placeholder="ADMIN_TOKEN o VIEWER_TOKEN" class="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-2 focus:ring-fet-green">
          </div>
          <div class="flex items-end">
            <button type="submit" class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-fet-green px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-fet-darkgreen">${icon('link', 'w-4 h-4')} Conectar</button>
          </div>
        </form>
        <p class="mt-2 text-[11px] text-slate-500">Los tokens se generan al ejecutar <code class="rounded bg-slate-100 px-1">setup()</code> en el editor de Apps Script (menú "FET Seguimiento → Mostrar tokens de acceso"). Consulte el README del repositorio para el paso a paso completo.</p>
        <p data-role="connect-error" class="mt-2 hidden text-xs font-semibold text-rose-600"></p>
        ` : `
        <button data-role="disconnect" class="flex items-center gap-1.5 rounded-lg border border-rose-300 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">${icon('unlink', 'w-4 h-4')} Desconectar y volver al modo demostración</button>
        `}
      </div>

      ${isLocal ? `
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-2 flex items-center gap-2 text-base font-bold text-slate-800">${icon('rotate-ccw', 'w-5 h-5 text-fet-green')} Datos de demostración</h2>
        <p class="mb-3 text-xs text-slate-500">Restaura el conjunto de actividades e informes de ejemplo tal como vienen en el repositorio, descartando cualquier cambio hecho en este navegador.</p>
        <button data-role="reset-demo" class="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Restablecer datos de demostración</button>
      </div>` : ''}

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">${icon('database', 'w-5 h-5 text-fet-green')} Catálogos</h2>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          ${CATALOG_KEYS.map((key) => `
          <div>
            <h3 class="mb-2 text-xs font-bold uppercase text-slate-600">${CATALOG_LABELS[key]}</h3>
            <ul class="mb-2 space-y-1">
              ${state.catalogs[key].length === 0 ? `<li class="text-xs text-slate-400">Sin valores registrados.</li>` :
                state.catalogs[key].map((v) => `
                <li class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                  <span class="font-medium text-slate-700">${esc(v)}</span>
                  ${readOnly ? '' : `<button data-del-cat="${key}" data-val="${esc(v)}" class="text-rose-500 hover:text-rose-700">${icon('x', 'w-3.5 h-3.5')}</button>`}
                </li>`).join('')}
            </ul>
            ${readOnly ? '' : `
            <form data-add-cat="${key}" class="flex gap-2">
              <input name="valor" placeholder="Agregar valor…" class="flex-grow rounded-lg border border-slate-300 p-1.5 text-xs focus:ring-2 focus:ring-fet-green">
              <button type="submit" class="rounded-lg bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-900">${icon('plus', 'w-3.5 h-3.5')}</button>
            </form>`}
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

export function mount(root) {
  const form = root.querySelector('[data-role="connect-form"]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const errEl = root.querySelector('[data-role="connect-error"]');
      errEl.classList.add('hidden');
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        await connectRemote(fd.get('url'), fd.get('token'));
        toast('Conectado a Google Sheets correctamente.', 'success');
      } catch (err) {
        errEl.textContent = describeError(err);
        errEl.classList.remove('hidden');
      } finally {
        btn.disabled = false;
      }
    });
  }

  const disconnectBtn = root.querySelector('[data-role="disconnect"]');
  if (disconnectBtn) disconnectBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Desconectar', message: 'Volverá al modo demostración con datos guardados solo en este navegador. ¿Continuar?', confirmLabel: 'Desconectar', tone: 'danger' });
    if (ok) disconnect();
  });

  const resetBtn = root.querySelector('[data-role="reset-demo"]');
  if (resetBtn) resetBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Restablecer demostración', message: 'Se perderán los cambios hechos en el modo demostración de este navegador. ¿Continuar?', confirmLabel: 'Restablecer', tone: 'danger' });
    if (!ok) return;
    resetDemoData();
    await connectLocal();
    toast('Datos de demostración restablecidos.', 'success');
  });

  root.querySelectorAll('[data-del-cat]').forEach((btn) => btn.addEventListener('click', async () => {
    const key = btn.dataset.delCat;
    const val = btn.dataset.val;
    const ok = await confirmDialog({ title: 'Eliminar valor de catálogo', message: `¿Eliminar "${esc(val)}"? Solo es posible si ninguna actividad lo está usando.` });
    if (!ok) return;
    try { await deleteCatalogItem(key, val); toast('Valor eliminado del catálogo.', 'success'); } catch (err) { toast(describeError(err), 'error'); }
  }));

  root.querySelectorAll('[data-add-cat]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = f.dataset.addCat;
    const input = f.querySelector('input[name="valor"]');
    const value = input.value.trim();
    if (!value) return;
    try { await addCatalogItem(key, value); input.value = ''; toast('Valor agregado al catálogo.', 'success'); } catch (err) { toast(describeError(err), 'error'); }
  }));
}
