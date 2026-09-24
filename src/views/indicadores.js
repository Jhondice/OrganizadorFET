import { icon } from '../ui/icons.js';
import { decorate, computeKpis, countBy, trendSeries } from '../domain/stats.js';
import { todayISO } from '../utils/dates.js';
import { state } from '../state/store.js';
import { renderChart } from '../services/charts.js';

const RISK_STYLE = { Bajo: 'text-emerald-600', Medio: 'text-amber-600', Alto: 'text-rose-600' };

export function render() {
  const acts = decorate(state.activities, todayISO());
  const kpis = computeKpis(acts);

  return `
    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-2 flex items-center justify-between"><span class="text-xs font-bold uppercase text-slate-500">Índice de cumplimiento global</span>${icon('target', 'w-5 h-5 text-fet-green')}</div>
          <div class="flex items-baseline gap-2"><span class="text-3xl font-black text-slate-800">${kpis.avanceGeneral}%</span></div>
          <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200"><div class="h-full bg-fet-green" style="width:${kpis.avanceGeneral}%"></div></div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-2 flex items-center justify-between"><span class="text-xs font-bold uppercase text-slate-500">Tasa de efectividad en cierre</span>${icon('award', 'w-5 h-5 text-blue-600')}</div>
          <div class="flex items-baseline gap-2"><span class="text-3xl font-black text-slate-800">${kpis.efectividad}%</span><span class="text-xs font-medium text-slate-500">${kpis.completadas} de ${kpis.total} finalizadas</span></div>
          <p class="mt-2 text-[11px] text-slate-400">Medido contra el total de actividades planificadas</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-2 flex items-center justify-between"><span class="text-xs font-bold uppercase text-slate-500">Nivel de riesgo por atrasos</span>${icon('shield-check', 'w-5 h-5 text-emerald-500')}</div>
          <div class="flex items-baseline gap-2"><span class="text-3xl font-black ${RISK_STYLE[kpis.riesgoNivel]}">${kpis.riesgo}%</span><span class="text-xs font-bold ${RISK_STYLE[kpis.riesgoNivel]}">Riesgo ${kpis.riesgoNivel}</span></div>
          <p class="mt-2 text-[11px] text-slate-400">${kpis.atrasadas} actividad(es) atrasada(s) de ${kpis.total}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-700">${icon('users', 'w-4 h-4 text-fet-green')} Distribución de carga por responsable</h3>
          <div class="relative h-64"><canvas id="chart-workload"></canvas></div>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase text-slate-700">${icon('trending-up', 'w-4 h-4 text-fet-green')} Tendencia de ejecución mensual</h3>
          <div class="relative h-64"><canvas id="chart-trend"></canvas></div>
        </div>
      </div>
    </div>`;
}

export function mount() {
  const acts = decorate(state.activities, todayISO());
  const workload = countBy(acts, 'responsable');
  renderChart('chart-workload', {
    type: 'pie',
    data: { labels: workload.map((w) => w.label), datasets: [{ data: workload.map((w) => w.value), backgroundColor: ['#005C29', '#EDBB00', '#0284c7', '#a855f7', '#64748b'] }] },
    options: { responsive: true, maintainAspectRatio: false },
  });

  const trend = trendSeries(acts, state.reports, todayISO());
  renderChart('chart-trend', {
    type: 'line',
    data: {
      labels: trend.labels,
      datasets: [
        { label: 'Planificado', data: trend.planned, borderColor: '#94a3b8', borderDash: [4, 4], fill: false, tension: 0.3 },
        { label: 'Real', data: trend.real, borderColor: '#005C29', backgroundColor: 'rgba(0,92,41,0.1)', fill: true, tension: 0.3, spanGaps: false },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } },
  });
}
