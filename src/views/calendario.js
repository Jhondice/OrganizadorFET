import { icon } from '../ui/icons.js';
import { esc } from '../ui/render-helpers.js';
import { MONTHS_ES, pad } from '../utils/dates.js';
import { decorate } from '../domain/stats.js';
import { STATUS_STYLE } from '../domain/constants.js';
import { state, setCalendarDate, setTab } from '../state/store.js';
import { todayISO } from '../utils/dates.js';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function render() {
  const d = state.ui.calendarDate;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const acts = decorate(state.activities, todayISO());

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('<div class="min-h-[90px] rounded bg-slate-100/50"></div>');
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const dayActs = acts.filter((a) => a.fecha_inicio <= iso && a.fecha_fin >= iso);
    cells.push(`
      <div class="flex min-h-[90px] flex-col justify-between rounded border border-slate-100 bg-white p-1.5 shadow-sm">
        <span class="text-xs font-extrabold text-slate-700">${day}</span>
        <div class="mt-1 max-h-[62px] space-y-1 overflow-y-auto">
          ${dayActs.map((a) => {
            const style = STATUS_STYLE[a.estado_efectivo] || STATUS_STYLE.Programada;
            return `<div data-act="${a.id}" title="${esc(a.nombre)} (${esc(a.estado_efectivo)})" class="cursor-pointer truncate rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs ${style.chip}">#${a.numero} ${esc(a.nombre)}</div>`;
          }).join('')}
        </div>
      </div>`);
  }

  return `
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-fet-green p-2.5 text-white">${icon('calendar', 'w-6 h-6')}</div>
          <div><h2 class="text-lg font-bold text-slate-800">Calendario institucional de actividades</h2><p class="text-xs text-slate-500">Cronograma de entregas, revisiones e hitos académicos</p></div>
        </div>
        <div class="flex items-center gap-2">
          <button data-role="prev" class="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100">${icon('chevron-left', 'w-4 h-4')}</button>
          <span class="w-40 text-center text-sm font-bold text-slate-800">${MONTHS_ES[month]} ${year}</span>
          <button data-role="next" class="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100">${icon('chevron-right', 'w-4 h-4')}</button>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-3 text-xs">
        <span class="font-bold text-slate-600">Leyenda:</span>
        ${Object.entries(STATUS_STYLE).map(([k, v]) => `<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full ${v.chip}"></span>${esc(k)}</span>`).join('')}
      </div>

      <div class="overflow-x-auto">
        <div class="min-w-[650px]">
          <div class="grid grid-cols-7 gap-1 rounded-t-lg bg-slate-100 py-2 text-center text-xs font-bold uppercase text-slate-600">
            ${WEEKDAYS.map((w) => `<div>${w}</div>`).join('')}
          </div>
          <div class="grid grid-cols-7 gap-1 rounded-b-lg bg-slate-200 p-1 text-xs">${cells.join('')}</div>
        </div>
      </div>
    </div>`;
}

export function mount(root) {
  root.querySelector('[data-role="prev"]').addEventListener('click', () => {
    const d = new Date(state.ui.calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d);
  });
  root.querySelector('[data-role="next"]').addEventListener('click', () => {
    const d = new Date(state.ui.calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d);
  });
  root.querySelectorAll('[data-act]').forEach((el) => el.addEventListener('click', () => setTab('plan')));
}
