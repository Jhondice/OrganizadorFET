import { icon } from './icons.js';

let root = null;

function ensureRoot() {
  if (root) return root;
  root = document.getElementById('toast-root');
  return root;
}

const VARIANTS = {
  success: { cls: 'border-emerald-300 bg-emerald-50 text-emerald-900', ic: 'check-circle-2', iconCls: 'text-emerald-600' },
  error: { cls: 'border-rose-300 bg-rose-50 text-rose-900', ic: 'circle-alert', iconCls: 'text-rose-600' },
  info: { cls: 'border-slate-300 bg-white text-slate-800', ic: 'info', iconCls: 'text-slate-500' },
};

export function toast(message, variant = 'success', duration = 4000) {
  const r = ensureRoot();
  if (!r) return;
  const v = VARIANTS[variant] || VARIANTS.info;
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-2.5 rounded-xl border ${v.cls} px-4 py-3 shadow-lg text-sm font-medium max-w-sm animate-toast-in`;
  el.innerHTML = `<span class="mt-0.5 shrink-0 ${v.iconCls}">${icon(v.ic, 'w-4 h-4')}</span><span class="leading-snug">${escapeHtml(message)}</span>`;
  r.appendChild(el);
  setTimeout(() => {
    el.classList.add('animate-toast-out');
    setTimeout(() => el.remove(), 200);
  }, duration);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
