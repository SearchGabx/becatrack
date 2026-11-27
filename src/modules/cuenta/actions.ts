'use server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { invalidarEstadoUsuarios } from '@/lib/estado-usuario';

const CambioSchema = z
  .object({
    actual: z.string().min(1),
    nueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .refine((v) => Buffer.byteLength(v) <= 72, 'La nueva contraseña es demasiado larga.'),
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, { message: 'Las contraseñas no coinciden.' })
  .refine((d) => d.nueva !== d.actual, { message: 'La nueva contraseña debe ser distinta.' });

export async function cambiarMiClave(_prev: string | undefined, form: FormData) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const datos = CambioSchema.safeParse(Object.fromEntries(form));
  if (!datos.success) return datos.error.issues[0]?.message ?? 'Revisa los datos.';

  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!usuario || !(await bcrypt.compare(datos.data.actual, usuario.passwordHash))) {
    return 'La contraseña actual no es correcta.';
  }
  await db.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash: await bcrypt.hash(datos.data.nueva, 10), debeCambiarClave: false },
  });
  invalidarEstadoUsuarios(usuario.id);
  revalidatePath('/dashboard', 'layout');
  return 'Contraseña actualizada.';
}
