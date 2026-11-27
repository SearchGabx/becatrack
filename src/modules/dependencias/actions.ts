'use server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { invalidarEstadoUsuarios } from '@/lib/estado-usuario';
import { requireModule } from '@/lib/guards';

const perfil = z.object({
  nombre: z.string().trim().min(1),
  responsable: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
});
const ruta = '/dashboard/dependencias';

export async function guardarDependencia(
  id: string | null,
  _prev: string | undefined,
  form: FormData,
) {
  await requireModule('dependencias');
  const datos = perfil.safeParse(Object.fromEntries(form));
  if (!datos.success) return 'Revisa el nombre, el responsable y el correo.';
  const { nombre } = datos.data;
  // Clave inicial aleatoria: se muestra una sola vez al admin y se pide cambiarla al ingresar.
  const claveInicial = id ? null : randomBytes(6).toString('base64url');
  try {
    await db.$transaction(async (tx) => {
      const anterior = id ? await tx.dependencia.findUniqueOrThrow({ where: { id } }) : null;
      const usuario = anterior?.usuarioId
        ? await tx.usuario.update({
            where: { id: anterior.usuarioId, rol: 'DEPENDENCIA' },
            data: { nombre },
          })
        : await tx.usuario.create({
            data: {
              nombre,
              rol: 'DEPENDENCIA',
              passwordHash: await bcrypt.hash(claveInicial ?? randomBytes(12).toString('hex'), 10),
              debeCambiarClave: true,
            },
          });
      const data = { ...datos.data, usuarioId: usuario.id };
      if (id) await tx.dependencia.update({ where: { id }, data });
      else await tx.dependencia.create({ data });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return 'El nombre o el correo ya está en uso.';
    throw e;
  }
  invalidarEstadoUsuarios();
  revalidatePath(ruta);
  return claveInicial
    ? `Dependencia creada. Clave inicial: ${claveInicial} (cópiala ahora, no se volverá a mostrar).`
    : 'Perfil actualizado.';
}

export async function cambiarClave(id: string | null, _prev: string | undefined, form: FormData) {
  await requireModule('dependencias');
  const clave = form.get('password');
  if (typeof clave !== 'string' || clave.trim().length < 8 || Buffer.byteLength(clave) > 72)
    return 'La contraseña debe tener entre 8 caracteres y 72 bytes.';
  const passwordHash = await bcrypt.hash(clave, 10);
  const result = await db.usuario.updateMany({
    where: { rol: 'DEPENDENCIA', dependencia: { is: id === null ? {} : { id } } },
    data: { passwordHash, debeCambiarClave: true },
  });
  invalidarEstadoUsuarios();
  return 'Contraseña actualizada en ' + result.count + ' perfil(es).';
}

export async function alternarActiva(id: string, activa: boolean) {
  await requireModule('dependencias');
  await db.dependencia.updateMany({
    where: { id, usuarioId: { not: null } },
    data: { activa: !activa },
  });
  invalidarEstadoUsuarios();
  revalidatePath(ruta);
}

export async function eliminarPerfil(id: string) {
  await requireModule('dependencias');
  await db.$transaction(async (tx) => {
    const d = await tx.dependencia.findUnique({
      where: { id },
      include: { _count: { select: { registros: true } } },
    });
    if (!d) return;
    if (d._count.registros) {
      await tx.dependencia.update({
        where: { id },
        data: { activa: false, usuarioId: null, email: null },
      });
    } else {
      await tx.dependencia.delete({ where: { id } });
    }
    if (d.usuarioId) await tx.usuario.delete({ where: { id: d.usuarioId, rol: 'DEPENDENCIA' } });
  });
  invalidarEstadoUsuarios();
  revalidatePath(ruta);
}

export async function asignarBecarioDependencia(
  dependenciaId: string,
  becarioId: string,
) {
  await requireModule('dependencias');
  if (!dependenciaId || !becarioId) return;
  await db.asignacionDependencia.upsert({
    where: {
      dependenciaId_becarioId: { dependenciaId, becarioId },
    },
    update: {},
    create: { dependenciaId, becarioId },
  });
  revalidatePath(ruta);
  revalidatePath('/dashboard/registro-horas');
}

export async function quitarBecarioDependencia(
  dependenciaId: string,
  becarioId: string,
) {
  await requireModule('dependencias');
  if (!dependenciaId || !becarioId) return;
  await db.asignacionDependencia.deleteMany({
    where: { dependenciaId, becarioId },
  });
  revalidatePath(ruta);
  revalidatePath('/dashboard/registro-horas');
}

