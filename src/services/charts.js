import Chart from 'chart.js/auto';

const registry = new Map();

/** Crea (o reemplaza) el gráfico asociado a un <canvas id="..."> ya presente en el DOM. */
export function renderChart(canvasId, config) {
  const existing = registry.get(canvasId);
  if (existing) existing.destroy();
  const el = document.getElementById(canvasId);
  if (!el) return null;
  const chart = new Chart(el.getContext('2d'), config);
  registry.set(canvasId, chart);
  return chart;
}

export function destroyAllCharts() {
  registry.forEach((c) => c.destroy());
  registry.clear();
}
