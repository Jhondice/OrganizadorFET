import { icon } from './icons.js';

/** Devuelve una promesa<boolean>. Sustituye a window.confirm con un diálogo propio y accesible. */
export function confirmDialog({ title = 'Confirmar', message, confirmLabel = 'Eliminar', tone = 'danger' } = {}) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    const toneCls = tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-fet-green hover:bg-fet-darkgreen';
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" data-role="backdrop">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true">
          <div class="flex items-center gap-3 mb-3">
            <span class="grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600">${icon('triangle-alert', 'w-5 h-5')}</span>
            <h3 class="text-base font-bold text-slate-800">${title}</h3>
          </div>
          <p class="text-sm text-slate-600 mb-5">${message}</p>
          <div class="flex justify-end gap-2">
            <button type="button" data-role="cancel" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="button" data-role="confirm" class="rounded-lg px-4 py-2 text-sm font-bold text-white shadow ${toneCls}">${confirmLabel}</button>
          </div>
        </div>
      </div>`;
    const close = (result) => { root.innerHTML = ''; resolve(result); };
    root.querySelector('[data-role="cancel"]').addEventListener('click', () => close(false));
    root.querySelector('[data-role="confirm"]').addEventListener('click', () => close(true));
    root.querySelector('[data-role="backdrop"]').addEventListener('click', (e) => { if (e.target === e.currentTarget) close(false); });
  });
}
