/**
 * Datos de ejemplo: fuente única de verdad.
 *  - El MODO DEMO los carga en localStorage.
 *  - `npm run seed:gs` genera backend/Seed.gs a partir de este archivo
 *    (para poblar la hoja de Google con la función `seedDemoData()`).
 */
const TS = '2026-08-01T08:00:00';

const act = (id, nombre, tipo, linea, responsable, fecha_inicio, fecha_fin, avance, estado, observaciones) => ({
  id, periodo: '2026-2', numero: id, nombre, tipo, linea, responsable,
  fecha_inicio, fecha_fin, avance, estado, observaciones, creado: TS, actualizado: TS,
});

const rep = (id, actividad_id, fecha_reporte, porcentaje, estado, avance_realizado, dificultades, resultados, acciones_siguientes, proxima_revision) => ({
  id, actividad_id, fecha_reporte, avance_realizado, dificultades, resultados, acciones_siguientes,
  porcentaje, estado, proxima_revision, autor: 'Docente', creado: `${fecha_reporte}T09:00:00`,
});

export const SEED = {
  catalogs: {
    periodo: ['2026-2', '2026-1', '2025-2'],
    tipo: ['Académica', 'Investigación', 'Administrativa', 'Proyección social', 'Capacitación'],
    linea: ['Docencia', 'Investigación', 'Extensión', 'Gestión académica', 'Desarrollo profesoral'],
    responsable: ['Docente', 'Coordinación', 'Dirección de Programa'],
  },
  activities: [
    act(1, 'Preparación de sílabos por asignatura', 'Académica', 'Docencia', 'Docente', '2026-08-01', '2026-08-10', 100, 'Completada', 'Sílabos cargados en el campus.'),
    act(2, 'Inducción a estudiantes', 'Académica', 'Docencia', 'Docente', '2026-08-03', '2026-08-08', 100, 'Completada', 'Realizada con éxito.'),
    act(3, 'Desarrollo de clases (Periodo 1)', 'Académica', 'Docencia', 'Docente', '2026-08-10', '2026-09-26', 70, 'En desarrollo', 'Clases desarrolladas según cronograma.'),
    act(4, 'Aplicación de evaluación parcial 1', 'Académica', 'Docencia', 'Docente', '2026-09-28', '2026-09-30', 0, 'Pendiente', 'Programada.'),
    act(5, 'Revisión de anteproyectos de grado', 'Investigación', 'Investigación', 'Docente', '2026-08-15', '2026-08-30', 50, 'En desarrollo', 'En revisión de documentos.'),
    act(6, 'Entrega de sílabos', 'Académica', 'Docencia', 'Docente', '2026-08-20', '2026-08-25', 100, 'Completada', 'Enviados a dirección de programa.'),
    act(7, 'Revisión de anteproyectos', 'Investigación', 'Investigación', 'Docente', '2026-08-25', '2026-08-30', 100, 'Completada', 'Dictámenes emitidos.'),
    act(8, 'Informe parcial de actividades', 'Administrativa', 'Gestión académica', 'Docente', '2026-09-01', '2026-09-05', 0, 'Pendiente', 'Preparación de borrador.'),
    act(9, 'Capacitación docente en pedagogía', 'Capacitación', 'Desarrollo profesoral', 'Coordinación', '2026-09-10', '2026-09-12', 80, 'En desarrollo', 'Asistencia activa.'),
    act(10, 'Cierre de actividades y entregas finales', 'Administrativa', 'Gestión académica', 'Docente', '2026-12-01', '2026-12-10', 0, 'Programada', 'Por ejecutar al final del periodo.'),
  ],
  reports: [
    rep(1, 1, '2026-08-10', 100, 'Completada', 'Sílabos cargados en el campus virtual para todas las asignaturas asignadas.', 'Sin novedades relevantes.', '100% de la planificación del microcurrículo completada.', 'Iniciar la impartición de clases.', ''),
    rep(2, 2, '2026-08-08', 100, 'Completada', 'Jornada de inducción desarrollada satisfactoriamente con asistencia completa.', 'Aforo limitado en el aula principal.', 'Estudiantes orientados sobre el reglamento y sílabos.', 'Monitorear adaptación inicial.', '2026-08-15'),
    rep(3, 3, '2026-08-31', 35, 'En desarrollo', 'Avance temático del 35% cumplido según lo planificado.', 'Ajuste de horarios por actividades extracurriculares.', 'Buen nivel de asistencia.', 'Continuar con las unidades 3 y 4.', '2026-09-15'),
    rep(4, 3, '2026-09-18', 70, 'En desarrollo', 'Avance temático del 70% cumplido según lo planificado.', 'Ajuste de horarios por actividades extracurriculares.', 'Buen nivel de asistencia y participación estudiantil.', 'Preparación de evaluaciones parciales.', '2026-09-28'),
    rep(5, 5, '2026-08-22', 25, 'En desarrollo', '25% de las propuestas revisadas.', 'Retrasos menores en entrega por parte de estudiantes.', 'Primeras retroalimentaciones enviadas.', 'Continuar con la primera tanda.', '2026-08-28'),
    rep(6, 5, '2026-08-30', 50, 'En desarrollo', '50% de las propuestas revisadas con correcciones devueltas.', 'Retrasos menores en entrega por parte de estudiantes.', 'Retroalimentaciones enviadas a los grupos.', 'Completar la revisión de la segunda tanda.', '2026-09-10'),
    rep(7, 6, '2026-08-25', 100, 'Completada', 'Entrega formal completada a la jefatura académica.', 'Ninguna.', 'Aprobación recibida.', 'Seguimiento periódico.', '2026-09-01'),
    rep(8, 7, '2026-08-30', 100, 'Completada', 'Evaluación formal de anteproyectos terminada.', 'Ninguna.', 'Proyectos viables aprobados.', 'Asignación de tutores.', '2026-09-05'),
    rep(9, 9, '2026-09-11', 40, 'En desarrollo', 'Asistencia a 2 de los 5 módulos programados.', 'Coordinación con horarios lectivos.', 'Constancia de asistencia parcial.', 'Asistir a los módulos restantes.', '2026-09-12'),
    rep(10, 9, '2026-09-12', 80, 'En desarrollo', 'Asistencia a 4 de los 5 módulos programados.', 'Coordinación con horarios lectivos.', 'Certificación parcial obtenida.', 'Completar el último módulo evaluativo.', '2026-09-15'),
  ],
};
