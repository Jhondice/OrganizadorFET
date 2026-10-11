import Chart from 'chart.js/auto';

const registry = new Map();

function normalizeChartOptions(config = {}) {
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;

  const opts = {
    ...config.options,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: isMobile ? 200 : 400,
    },
  };

  if (opts.plugins) {
    opts.plugins = {
      ...opts.plugins,
      legend: {
        ...((opts.plugins.legend && typeof opts.plugins.legend === 'object') ? opts.plugins.legend : {}),
        labels: {
          ...(opts.plugins.legend && opts.plugins.legend.labels ? opts.plugins.legend.labels : {}),
          font: {
            ...(opts.plugins.legend && opts.plugins.legend.labels && opts.plugins.legend.labels.font ? opts.plugins.legend.labels.font : {}),
            size: isMobile ? 9 : 10,
          },
          boxWidth: isMobile ? 10 : 12,
        },
      },
      tooltip: {
        ...(opts.plugins.tooltip || {}),
        enabled: true,
      },
    };
  }

  if (opts.scales) {
    opts.scales = {
      ...opts.scales,
      x: {
        ...((opts.scales.x && typeof opts.scales.x === 'object') ? opts.scales.x : {}),
        ticks: {
          ...(opts.scales.x && opts.scales.x.ticks ? opts.scales.x.ticks : {}),
          maxTicksLimit: isMobile ? 5 : undefined,
          font: {
            ...(opts.scales.x && opts.scales.x.ticks && opts.scales.x.ticks.font ? opts.scales.x.ticks.font : {}),
            size: isMobile ? 9 : 10,
          },
        },
      },
      y: {
        ...((opts.scales.y && typeof opts.scales.y === 'object') ? opts.scales.y : {}),
        ticks: {
          ...(opts.scales.y && opts.scales.y.ticks ? opts.scales.y.ticks : {}),
          maxTicksLimit: isMobile ? 5 : undefined,
          font: {
            ...(opts.scales.y && opts.scales.y.ticks && opts.scales.y.ticks.font ? opts.scales.y.ticks.font : {}),
            size: isMobile ? 9 : 10,
          },
        },
      },
    };
  }

  return { ...config, options: opts };
}

/** Crea (o reemplaza) el gráfico asociado a un <canvas id="..."> ya presente en el DOM. */
export function renderChart(canvasId, config) {
  const existing = registry.get(canvasId);
  if (existing) existing.destroy();
  const el = document.getElementById(canvasId);
  if (!el) return null;

  const safeConfig = normalizeChartOptions(config);
  const chart = new Chart(el.getContext('2d'), safeConfig);
  registry.set(canvasId, chart);
  return chart;
}

export function destroyAllCharts() {
  registry.forEach((c) => c.destroy());
  registry.clear();
}
