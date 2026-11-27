import { db } from '@/lib/db';

const DIAS_SEMANA: Record<number, string> = {
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

export function diaSemanaDeFecha(fecha: Date): string | null {
  // Calcula el día de la semana en America/Bogota (UTC-5)
  const bogotaMs = fecha.getTime() - 5 * 3600 * 1000;
  const diaNum = new Date(bogotaMs).getUTCDay();
  return DIAS_SEMANA[diaNum] ?? null;
}

export interface BecarioDisponibleDTO {
  id: string;
  documento: string;
  nombre: string;
  programa: string;
  promocion: string | null;
  correo: string | null;
  contacto: string | null;
}

export interface JornadaSolicitudDTO {
  id: string;
  orden: number;
  fecha: Date;
  fechaTexto: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  cantidadRequerida: number;
  asignados: BecarioDisponibleDTO[];
}

export async function obtenerDatosSolicitudesStaff(
  rol: 'ADMIN' | 'DEPENDENCIA' | 'BECARIO',
  usuarioId: string,
) {
  const esAdmin = rol === 'ADMIN';

  const [solicitudes, becariosActivos, estudiantes, dependencias] =
    await Promise.all([
      db.solicitudStaff.findMany({
        where: esAdmin ? {} : { dependencia: { usuarioId } },
        include: {
          dependencia: {
            select: { id: true, nombre: true, responsable: true, email: true },
          },
          jornadas: {
            orderBy: { orden: 'asc' },
            include: {
              becarios: {
                select: {
                  becario: {
                    select: {
                      id: true,
                      documento: true,
                      programa: true,
                      promocion: true,
                      telefono: true,
                      usuario: { select: { nombre: true, email: true } },
                    },
                  },
                },
                orderBy: { becario: { usuario: { nombre: 'asc' } } },
              },
            },
          },
          becarios: {
            select: {
              jornadaId: true,
              becario: {
                select: {
                  id: true,
                  documento: true,
                  programa: true,
                  promocion: true,
                  telefono: true,
                  usuario: { select: { nombre: true, email: true } },
                },
              },
            },
            orderBy: { becario: { usuario: { nombre: 'asc' } } },
          },
        },
        orderBy: [{ estado: 'asc' }, { fecha: 'asc' }, { creadoEn: 'desc' }],
      }),
      esAdmin
        ? db.becario.findMany({
            where: { usuario: { activo: true } },
            select: {
              id: true,
              documento: true,
              programa: true,
              promocion: true,
              telefono: true,
              usuario: { select: { nombre: true, email: true } },
            },
            orderBy: { usuario: { nombre: 'asc' } },
          })
        : Promise.resolve([]),
      db.student.findMany({
        select: { id: true, promo: true, correo: true, contacto: true },
      }),
      esAdmin
        ? db.dependencia.findMany({
            where: { activa: true },
            select: { id: true, nombre: true },
            orderBy: { nombre: 'asc' },
          })
        : Promise.resolve(undefined),
    ]);

  const mapaStudent = new Map(estudiantes.map((s) => [s.id, s]));

  const mapearBecario = (b: {
    id: string;
    documento: string;
    programa: string;
    promocion: string | null;
    telefono: string | null;
    usuario: { nombre: string; email: string | null };
  }): BecarioDisponibleDTO => {
    const st = mapaStudent.get(b.documento);
    return {
      id: b.id,
      documento: b.documento,
      nombre: b.usuario.nombre,
      programa: b.programa || 'Sin programa registrado',
      promocion: b.promocion ?? st?.promo ?? null,
      correo: b.usuario.email ?? st?.correo ?? null,
      contacto: b.telefono ?? st?.contacto ?? null,
    };
  };

  const catalogoBecarios: BecarioDisponibleDTO[] = esAdmin
    ? becariosActivos.map(mapearBecario)
    : [];

  const solicitudesMapeadas = solicitudes.map((sol) => {
    const jornadas: JornadaSolicitudDTO[] =
      sol.jornadas.length > 0
        ? sol.jornadas.map((j) => {
            const asignadosDirectos = j.becarios.map((x) =>
              mapearBecario(x.becario),
            );
            // Si había asignados legacy sin jornadaId en la primera jornada, los incluimos
            const asignadosLegacy =
              j.orden === 1
                ? sol.becarios
                    .filter((x) => !x.jornadaId)
                    .map((x) => mapearBecario(x.becario))
                : [];
            const mapaUnicos = new Map<string, BecarioDisponibleDTO>();
            for (const a of [...asignadosDirectos, ...asignadosLegacy]) {
              mapaUnicos.set(a.id, a);
            }
            return {
              id: j.id,
              orden: j.orden,
              fecha: j.fecha,
              fechaTexto: j.fecha.toLocaleDateString('es-CO', {
                timeZone: 'America/Bogota',
              }),
              diaSemana: diaSemanaDeFecha(j.fecha) ?? 'DOMINGO',
              horaInicio: j.horaInicio,
              horaFin: j.horaFin,
              cantidadRequerida: j.cantidadRequerida,
              asignados: Array.from(mapaUnicos.values()),
            };
          })
        : [
            {
              id: sol.id,
              orden: 1,
              fecha: sol.fecha,
              fechaTexto: sol.fecha.toLocaleDateString('es-CO', {
                timeZone: 'America/Bogota',
              }),
              diaSemana: diaSemanaDeFecha(sol.fecha) ?? 'DOMINGO',
              horaInicio: sol.horaInicio,
              horaFin: sol.horaFin,
              cantidadRequerida: sol.cantidadRequerida,
              asignados: sol.becarios.map((x) => mapearBecario(x.becario)),
            },
          ];

    return {
      id: sol.id,
      nombreEvento: sol.nombreEvento,
      descripcion: sol.descripcion,
      estado: sol.estado,
      observacionAdmin: sol.observacionAdmin,
      dependencia: sol.dependencia,
      jornadas,
    };
  });

  return {
    solicitudes: solicitudesMapeadas,
    catalogoBecarios,
    dependencias,
  };
}
