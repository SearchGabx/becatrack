'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';

const TareaSchema = z.object({
  becarioId: z.string().min(1),
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  fechaLimite: z.coerce.date(),
});

export async function crearTarea(
  _prev: string | undefined,
  formData: FormData,
) {
  await requireModule('tareas');
  const datos = TareaSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return 'Revisa los datos de la tarea.';
  await db.tarea.create({ data: datos.data });
  revalidatePath('/dashboard/tareas');
  return 'Tarea creada.';
}

export async function cambiarEstadoTarea(
  id: string,
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA',
) {
  await requireModule('tareas');
  const nuevo = z.enum(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA']).parse(estado);
  await db.tarea.update({ where: { id }, data: { estado: nuevo } });
  revalidatePath('/dashboard/tareas');
}
