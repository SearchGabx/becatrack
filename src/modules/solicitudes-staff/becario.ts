import { db } from '@/lib/db';
import { diaSemanaDeFecha } from './queries';

/** Solicitudes de staff aprobadas por el Admin donde el becario quedó asignado. */
export async function solicitudesAsignadasBecario(usuarioId: string) {
  const becario = await db.becario.findUnique({
    where: { usuarioId },
    select: { id: true },
  });
  if (!becario) return [];

  const solicitudes = await db.solicitudStaff.findMany({
    where: { estado: 'APROBADA', becarios: { some: { becarioId: becario.id } } },
    select: {
      id: true,
      nombreEvento: true,
      descripcion: true,
      observacionAdmin: true,
      actualizadoEn: true,
      dependencia: { select: { nombre: true, responsable: true, email: true } },
      jornadas: {
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          orden: true,
          fecha: true,
          horaInicio: true,
          horaFin: true,
          cantidadRequerida: true,
          becarios: {
            select: {
              becario: {
                select: {
                  id: true,
                  programa: true,
                  usuario: { select: { nombre: true, email: true } },
                },
              },
            },
            orderBy: { becario: { usuario: { nombre: 'asc' } } },
          },
        },
      },
    },
    orderBy: { fecha: 'asc' },
  });

  return solicitudes.map((s) => ({
    id: s.id,
    nombreEvento: s.nombreEvento,
    descripcion: s.descripcion,
    observacionAdmin: s.observacionAdmin,
    respondidaEn: s.actualizadoEn,
    dependencia: s.dependencia,
    jornadas: s.jornadas.map((j) => {
      const integrantes = j.becarios.map(({ becario: b }) => ({
        id: b.id,
        nombre: b.usuario.nombre,
        correo: b.usuario.email,
        programa: b.programa || 'Sin programa registrado',
        esYo: b.id === becario.id,
      }));
      return {
        id: j.id,
        orden: j.orden,
        fechaTexto: j.fecha.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
        diaSemana: diaSemanaDeFecha(j.fecha) ?? 'DOMINGO',
        horaInicio: j.horaInicio,
        horaFin: j.horaFin,
        cantidadRequerida: j.cantidadRequerida,
        estoyAsignado: integrantes.some((i) => i.esYo),
        integrantes,
      };
    }),
  }));
}
