import { STATUS_STYLE } from '../domain/constants.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function statusBadge(status) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Programada;
  return `<span class="inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.badge}">${esc(status)}</span>`;
}

export function progressBar(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return `
    <div class="flex items-center gap-1.5">
      <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div class="h-full bg-fet-green" style="width:${p}%"></div></div>
      <span class="text-[11px] font-bold text-slate-700 w-9 text-right">${p}%</span>
    </div>`;
}

export function emptyState(message, iconHtml) {
  return `<div class="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">${iconHtml || ''}<p class="text-xs font-medium">${esc(message)}</p></div>`;
}
