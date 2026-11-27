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
  promocion: z.string().trim().optional(),
  programa: z.string().min(3),
  semestre: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).max(12).optional(),
  ),
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
  const { nombre, email, promocion, ...ficha } = datos.data;

  const existe = await db.usuario.findUnique({ where: { email } });
  if (existe) return 'Ya existe un usuario con ese correo.';

  // Contraseña inicial = documento; se recomienda cambiarla en el primer ingreso.
  const passwordHash = await bcrypt.hash(ficha.documento, 10);
  await db.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: { nombre, email, passwordHash, rol: 'BECARIO', debeCambiarClave: true },
    });
    await tx.becario.create({
      data: {
        ...ficha,
        promocion: promocion || null,
        usuarioId: usuario.id,
      },
    });
  });
  revalidatePath('/dashboard/crm');
  return 'Becario creado.';
}

export async function actualizarHorasRequeridas(
  becarioId: string,
  horasRequeridas: number,
) {
  await requireModule('crm');
  const valor = z.coerce.number().int().min(1).max(1000).safeParse(horasRequeridas);
  if (!valor.success) return { ok: false, mensaje: 'Valor inválido (1-1000).' };

  await db.becario.update({
    where: { id: becarioId },
    data: { horasRequeridas: valor.data },
  });
  revalidatePath('/dashboard/crm');
  revalidatePath(`/dashboard/crm/${becarioId}`);
  revalidatePath('/dashboard/conteo-horas');
  return { ok: true };
}

const ESTADOS_PERIODO = ['En curso', 'Cumplido', 'Pendiente', 'Exonerado'] as const;

export async function actualizarServicioPeriodo(
  becarioId: string,
  estado: string,
) {
  await requireModule('crm');
  const valor = z.enum(ESTADOS_PERIODO).safeParse(estado);
  if (!valor.success) return { ok: false };

  await db.becario.update({
    where: { id: becarioId },
    data: { servicioPeriodoLectivo: valor.data },
  });
  revalidatePath('/dashboard/crm');
  revalidatePath(`/dashboard/crm/${becarioId}`);
  return { ok: true };
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
