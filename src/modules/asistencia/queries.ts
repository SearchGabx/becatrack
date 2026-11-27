import { db } from '@/lib/db';
import { estadoAsistencia, contarAsistencia, horasEntre } from './resumen';

/** Becarios activos con su estado en la reunión (todos los becarios están convocados). */
export async function detalleReunion(reunionId: string) {
  const [reunion, becarios] = await Promise.all([
    db.reunion.findUnique({ where: { id: reunionId } }),
    db.becario.findMany({
      where: { usuario: { activo: true } },
      orderBy: { usuario: { nombre: 'asc' } },
      select: {
        id: true,
        documento: true,
        programa: true,
        usuario: { select: { nombre: true } },
        escaneos: { where: { reunionId }, select: { tipo: true, fecha: true } },
      },
    }),
  ]);
  if (!reunion) return null;

  const filas = becarios.map((b) => {
    const inicio = b.escaneos.find((e) => e.tipo === 'INICIO')?.fecha;
    const fin = b.escaneos.find((e) => e.tipo === 'FIN')?.fecha;
    return {
      becarioId: b.id,
      nombre: b.usuario.nombre,
      documento: b.documento,
      programa: b.programa,
      inicio,
      fin,
      horas: horasEntre(inicio, fin),
      estado: estadoAsistencia(b.escaneos.map((e) => e.tipo)),
    };
  });
  return { reunion, filas, conteo: contarAsistencia(filas.map((f) => f.estado)) };
}

export async function historialBecarioPorId(becarioId: string) {
  const reuniones = await db.reunion.findMany({
    orderBy: { fecha: 'desc' },
    take: 30,
    select: {
      id: true,
      nombre: true,
      fecha: true,
      escaneos: { where: { becarioId }, select: { tipo: true, fecha: true } },
    },
  });
  return reuniones.map((r) => ({
    ...r,
    estado: estadoAsistencia(r.escaneos.map((e) => e.tipo)),
  }));
}

export async function historialBecario(usuarioId: string) {
  const becario = await db.becario.findUnique({
    where: { usuarioId },
    select: { id: true },
  });
  if (!becario) return [];
  return historialBecarioPorId(becario.id);
}
