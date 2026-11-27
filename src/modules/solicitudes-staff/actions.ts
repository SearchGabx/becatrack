'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { HORAS, toMin } from '@/modules/horario/constants';

const RUTA = '/dashboard/solicitudes-staff';

const JornadaInputSchema = z
  .object({
    fecha: z
      .string()
      .min(10, 'Selecciona una fecha válida en cada jornada.')
      .transform((v) => new Date(`${v}T12:00:00-05:00`))
      .refine((d) => !Number.isNaN(d.getTime()), 'Fecha inválida en una jornada.'),
    horaInicio: z
      .string()
      .refine((h) => HORAS.includes(h), 'Selecciona la hora de inicio.'),
    horaFin: z
      .string()
      .refine((h) => HORAS.includes(h), 'Selecciona la hora de finalización.'),
    cantidadRequerida: z.coerce
      .number()
      .int()
      .min(1, 'Solicita al menos 1 becario por jornada.')
      .max(50, 'Máximo 50 becarios por jornada.'),
  })
  .refine(
    (d) => {
      const ini = toMin(d.horaInicio);
      const fin = toMin(d.horaFin);
      return ini !== null && fin !== null && fin > ini;
    },
    {
      message:
        'En cada jornada, la hora de finalización debe ser posterior a la hora de inicio.',
    },
  );

const SolicitudSchema = z.object({
  dependenciaId: z.string().optional(),
  nombreEvento: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre del evento o apoyo.'),
  descripcion: z
    .string()
    .trim()
    .min(5, 'Describe brevemente las funciones o lugar del apoyo.'),
  jornadas: z
    .array(JornadaInputSchema)
    .min(1, 'Agrega al menos una jornada para la actividad.')
    .max(15, 'Máximo 15 jornadas por solicitud.'),
});

export async function crearSolicitudStaff(
  _prev: string | undefined,
  formData: FormData,
) {
  const usuario = await requireModule('solicitudesStaff');

  let jornadasRaw: unknown = [];
  const jsonJornadas = formData.get('jornadas');
  if (typeof jsonJornadas === 'string' && jsonJornadas.trim()) {
    try {
      jornadasRaw = JSON.parse(jsonJornadas);
    } catch {
      return 'Formato de jornadas inválido.';
    }
  } else {
    jornadasRaw = [
      {
        fecha: formData.get('fecha'),
        horaInicio: formData.get('horaInicio'),
        horaFin: formData.get('horaFin'),
        cantidadRequerida: formData.get('cantidadRequerida'),
      },
    ];
  }

  const datos = SolicitudSchema.safeParse({
    dependenciaId: formData.get('dependenciaId') || undefined,
    nombreEvento: formData.get('nombreEvento'),
    descripcion: formData.get('descripcion'),
    jornadas: jornadasRaw,
  });

  if (!datos.success) {
    return datos.error.issues[0]?.message ?? 'Revisa los datos de la solicitud.';
  }

  const dependencia = await db.dependencia.findFirst({
    where:
      usuario.rol === 'DEPENDENCIA'
        ? { usuarioId: usuario.id, activa: true }
        : { id: datos.data.dependenciaId, activa: true },
    select: { id: true },
  });
  if (!dependencia) {
    return 'No se encontró una dependencia activa asociada.';
  }

  const primera = datos.data.jornadas[0];
  const totalRequeridos = datos.data.jornadas.reduce(
    (acc, j) => acc + j.cantidadRequerida,
    0,
  );

  await db.solicitudStaff.create({
    data: {
      dependenciaId: dependencia.id,
      nombreEvento: datos.data.nombreEvento,
      fecha: primera.fecha,
      horaInicio: primera.horaInicio,
      horaFin: primera.horaFin,
      cantidadRequerida: totalRequeridos,
      descripcion: datos.data.descripcion,
      jornadas: {
        create: datos.data.jornadas.map((j, idx) => ({
          orden: idx + 1,
          fecha: j.fecha,
          horaInicio: j.horaInicio,
          horaFin: j.horaFin,
          cantidadRequerida: j.cantidadRequerida,
        })),
      },
    },
  });

  revalidatePath(RUTA);
  return 'Solicitud enviada. El administrador revisará la disponibilidad y asignará el listado por jornada.';
}

export async function aprobarSolicitudStaff(entrada: {
  solicitudId: string;
  asignacionesPorJornada: { jornadaId: string; becarioIds: string[] }[];
  observacionAdmin?: string;
}): Promise<{ ok: boolean; mensaje: string }> {
  const usuario = await requireModule('solicitudesStaff');
  if (usuario.rol !== 'ADMIN') {
    return { ok: false, mensaje: 'Solo el administrador puede aprobar solicitudes.' };
  }

  const filas: { solicitudId: string; jornadaId: string; becarioId: string }[] = [];
  for (const item of entrada.asignacionesPorJornada) {
    const unicos = Array.from(new Set(item.becarioIds.filter(Boolean)));
    if (unicos.length === 0) {
      return {
        ok: false,
        mensaje: 'Cada jornada debe tener al menos un becario cargado antes de aprobar.',
      };
    }
    for (const becarioId of unicos) {
      filas.push({
        solicitudId: entrada.solicitudId,
        jornadaId: item.jornadaId,
        becarioId,
      });
    }
  }

  if (filas.length === 0) {
    return {
      ok: false,
      mensaje: 'Pega o selecciona al menos un becario antes de aprobar.',
    };
  }

  await db.$transaction(async (tx) => {
    // Si es una solicitud previa sin filas en SolicitudStaffJornada, creamos la jornada base
    const jornadasDB = await tx.solicitudStaffJornada.findMany({
      where: { solicitudId: entrada.solicitudId },
      select: { id: true },
    });
    let mapaJornadaId = new Set(jornadasDB.map((j) => j.id));
    let idJornadaFallback: string | null = null;

    if (jornadasDB.length === 0) {
      const sol = await tx.solicitudStaff.findUniqueOrThrow({
        where: { id: entrada.solicitudId },
      });
      const creada = await tx.solicitudStaffJornada.create({
        data: {
          solicitudId: sol.id,
          orden: 1,
          fecha: sol.fecha,
          horaInicio: sol.horaInicio,
          horaFin: sol.horaFin,
          cantidadRequerida: sol.cantidadRequerida,
        },
      });
      idJornadaFallback = creada.id;
      mapaJornadaId = new Set([creada.id]);
    }

    await tx.solicitudStaffBecario.deleteMany({
      where: { solicitudId: entrada.solicitudId },
    });
    await tx.solicitudStaffBecario.createMany({
      data: filas.map((f) => ({
        solicitudId: f.solicitudId,
        jornadaId: mapaJornadaId.has(f.jornadaId)
          ? f.jornadaId
          : idJornadaFallback,
        becarioId: f.becarioId,
      })),
    });
    await tx.solicitudStaff.update({
      where: { id: entrada.solicitudId },
      data: {
        estado: 'APROBADA',
        observacionAdmin: entrada.observacionAdmin?.trim() || null,
      },
    });
  });

  revalidatePath(RUTA);
  return {
    ok: true,
    mensaje: `Solicitud aprobada y listado enviado (${filas.length} asignación(es) en ${entrada.asignacionesPorJornada.length} jornada(s)).`,
  };
}

export async function rechazarSolicitudStaff(entrada: {
  solicitudId: string;
  observacionAdmin?: string;
}): Promise<{ ok: boolean; mensaje: string }> {
  const usuario = await requireModule('solicitudesStaff');
  if (usuario.rol !== 'ADMIN') {
    return { ok: false, mensaje: 'Solo el administrador puede rechazar solicitudes.' };
  }

  await db.$transaction(async (tx) => {
    await tx.solicitudStaffBecario.deleteMany({
      where: { solicitudId: entrada.solicitudId },
    });
    await tx.solicitudStaff.update({
      where: { id: entrada.solicitudId },
      data: {
        estado: 'RECHAZADA',
        observacionAdmin: entrada.observacionAdmin?.trim() || null,
      },
    });
  });

  revalidatePath(RUTA);
  return { ok: true, mensaje: 'Solicitud marcada como rechazada.' };
}

export async function eliminarSolicitudStaff(
  solicitudId: string,
): Promise<{ ok: boolean; mensaje: string }> {
  const usuario = await requireModule('solicitudesStaff');
  if (usuario.rol !== 'ADMIN') {
    return { ok: false, mensaje: 'Solo el administrador puede eliminar solicitudes.' };
  }
  await db.solicitudStaff.deleteMany({ where: { id: solicitudId } });
  revalidatePath(RUTA);
  revalidatePath('/dashboard/staff');
  return { ok: true, mensaje: 'Solicitud eliminada.' };
}
