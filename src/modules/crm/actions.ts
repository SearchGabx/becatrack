'use server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';

const BecarioSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().trim().toLowerCase().email(),
  documento: z.string().min(5),
  programa: z.string().min(3),
  semestre: z.coerce.number().int().min(1).max(12),
  telefono: z.string().optional(),
  horasRequeridas: z.coerce.number().int().positive().default(100),
});

export async function crearBecario(
  _prev: string | undefined,
  formData: FormData,
) {
  await requireModule('crm');
  const datos = BecarioSchema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return 'Revisa los datos del becario.';
  const { nombre, email, ...ficha } = datos.data;

  const existe = await db.usuario.findUnique({ where: { email } });
  if (existe) return 'Ya existe un usuario con ese correo.';

  // Contraseña inicial = documento; se recomienda cambiarla en el primer ingreso.
  const passwordHash = await bcrypt.hash(ficha.documento, 10);
  await db.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: { nombre, email, passwordHash, rol: 'BECARIO', debeCambiarClave: true },
    });
    await tx.becario.create({
      data: { ...ficha, usuarioId: usuario.id },
    });
  });
  revalidatePath('/dashboard/crm');
  return 'Becario creado.';
}

export async function agregarSeguimiento(
  becarioId: string,
  formData: FormData,
) {
  await requireModule('crm');
  const datos = z
    .object({ tipo: z.string().trim().min(3), nota: z.string().trim().min(3) })
    .safeParse({ tipo: formData.get('tipo'), nota: formData.get('nota') });
  if (!datos.success) return; // el formulario exige ambos campos; se ignora un envío incompleto
  await db.seguimiento.create({ data: { becarioId, ...datos.data } });
  revalidatePath(`/dashboard/crm/${becarioId}`);
}
