'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';

const RegistroSchema = z.object({
  documento: z.string().min(5),
  dependenciaId: z.string().optional(),
  fecha: z.coerce.date().refine((f) => f <= new Date(), 'La fecha no puede ser futura'),
  horas: z.coerce.number().positive().max(12),
  actividad: z.string().min(5),
});

export async function registrarHoras(
  _prev: string | undefined,
  formData: FormData,
) {
  const usuario = await requireModule('registroHoras');
  const datos = RegistroSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) {
    return 'Revisa los datos: fecha no futura, horas entre 0 y 12 y actividad descrita.';
  }

  // La dependencia solo puede registrar a su nombre; el admin elige la dependencia.
  const dependencia = await db.dependencia.findFirst({
    where:
      usuario.rol === 'DEPENDENCIA'
        ? { usuarioId: usuario.id, activa: true }
        : { id: datos.data.dependenciaId, activa: true },
  });
  if (!dependencia) return 'Dependencia no encontrada o inactiva.';

  const becario = await db.becario.findUnique({
    where: { documento: datos.data.documento },
  });
  if (!becario) return 'No existe un becario con ese documento.';

  await db.registroHoras.create({
    data: {
      becarioId: becario.id,
      dependenciaId: dependencia.id,
      fecha: datos.data.fecha,
      horas: datos.data.horas,
      actividad: datos.data.actividad,
    },
  });
  revalidatePath('/dashboard/registro-horas');
  revalidatePath('/dashboard/conteo-horas');
  return 'Registro guardado. Queda pendiente de aprobación.';
}

export async function cambiarEstadoRegistro(
  id: string,
  estado: 'APROBADO' | 'RECHAZADO',
) {
  const usuario = await requireModule('registroHoras');
  if (usuario.rol !== 'ADMIN') {
    throw new Error('Solo el administrador aprueba horas');
  }
  const nuevo = z.enum(['APROBADO', 'RECHAZADO']).parse(estado);
  // Solo se decide sobre registros pendientes
  await db.registroHoras.updateMany({ where: { id, estado: 'PENDIENTE' }, data: { estado: nuevo } });
  revalidatePath('/dashboard/registro-horas');
  revalidatePath('/dashboard/conteo-horas');
}
