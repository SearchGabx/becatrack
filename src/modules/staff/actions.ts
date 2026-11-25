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
  const eventoId = String(formData.get('eventoId'));
  const becarioId = String(formData.get('becarioId'));
  const funcion = String(formData.get('funcion'));
  const horas = Number(formData.get('horas') ?? 0);

  const evento = await db.evento.findUniqueOrThrow({
    where: { id: eventoId },
    include: { _count: { select: { asignaciones: true } } },
  });
  if (evento._count.asignaciones >= evento.cupos) {
    return 'El evento ya no tiene cupos.';
  }

  await db.asignacionStaff.upsert({
    where: { eventoId_becarioId: { eventoId, becarioId } },
    update: { funcion, horas },
    create: { eventoId, becarioId, funcion, horas },
  });
  revalidatePath('/dashboard/staff');
  revalidatePath('/dashboard/conteo-horas');
  return 'Becario asignado.';
}
