export const STATUSES = ['Programada', 'Pendiente', 'En desarrollo', 'Completada', 'Atrasada'];
export const CATALOG_KEYS = ['periodo', 'tipo', 'linea', 'responsable'];
export const CATALOG_LABELS = {
  periodo: 'Periodos',
  tipo: 'Tipos de actividad',
  linea: 'Líneas estratégicas',
  responsable: 'Responsables',
};

export const LIMITS = { nombre: 200, corto: 80, texto: 2000, obs: 1000 };

/** Estilos por estado (clases Tailwind completas para que el compilador las detecte). */
export const STATUS_STYLE = {
  Completada: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', chip: 'bg-emerald-500', hex: '#22c55e' },
  'En desarrollo': { badge: 'bg-blue-100 text-blue-800 border-blue-300', chip: 'bg-blue-500', hex: '#3b82f6' },
  Pendiente: { badge: 'bg-amber-100 text-amber-800 border-amber-300', chip: 'bg-amber-500', hex: '#f59e0b' },
  Programada: { badge: 'bg-slate-100 text-slate-700 border-slate-300', chip: 'bg-slate-500', hex: '#64748b' },
  Atrasada: { badge: 'bg-rose-100 text-rose-800 border-rose-300', chip: 'bg-rose-500', hex: '#f43f5e' },
};
