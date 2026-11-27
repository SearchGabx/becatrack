'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';

async function soloAdmin() {
  const usuario = await requireModule('staff');
  if (usuario.rol !== 'ADMIN') {
    throw new Error('Solo el administrador gestiona eventos');
  }
}

const EventoSchema = z.object({
  nombre: z.string().min(3),
  fecha: z.coerce.date(),
  lugar: z.string().min(3),
  cupos: z.coerce.number().int().positive(),
});

const AsignacionSchema = z.object({
  eventoId: z.string().min(1),
  becarioId: z.string().min(1),
  funcion: z.string().trim().min(3),
  horas: z.coerce.number().min(0).max(24),
});

export async function crearEvento(
  _prev: string | undefined,
  formData: FormData,
) {
  await soloAdmin();
  const datos = EventoSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return 'Revisa los datos del evento.';
  await db.evento.create({ data: datos.data });
  revalidatePath('/dashboard/staff');
  return 'Evento creado.';
}

export async function asignarBecario(
  _prev: string | undefined,
  formData: FormData,
) {
  await soloAdmin();
  const datos = AsignacionSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return 'Revisa la asignación: función y horas entre 0 y 24.';
  const { eventoId, becarioId, funcion, horas } = datos.data;

  // Cupos y asignación en una sola transacción para que dos admins no excedan el cupo.
  const resultado = await db.$transaction(async (tx) => {
    const evento = await tx.evento.findUnique({
      where: { id: eventoId },
      include: { _count: { select: { asignaciones: true } } },
    });
    if (!evento) return 'El evento no existe.';
    const existente = await tx.asignacionStaff.findUnique({
      where: { eventoId_becarioId: { eventoId, becarioId } },
    });
    if (!existente && evento._count.asignaciones >= evento.cupos) {
      return 'El evento ya no tiene cupos.';
    }
    await tx.asignacionStaff.upsert({
      where: { eventoId_becarioId: { eventoId, becarioId } },
      update: { funcion, horas },
      create: { eventoId, becarioId, funcion, horas },
    });
    return null;
  });
  if (resultado) return resultado;
  revalidatePath('/dashboard/staff');
  revalidatePath('/dashboard/conteo-horas');
  return 'Becario asignado.';
}
