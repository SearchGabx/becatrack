'use server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { firmarToken, verificarToken } from './token';

const ruta = '/dashboard/asistencia';

async function soloAdmin() {
  const usuario = await requireModule('asistencia');
  if (usuario.rol !== 'ADMIN') throw new Error('Solo el administrador gestiona la asistencia');
  return usuario;
}

const ReunionSchema = z.object({
  nombre: z.string().trim().min(3).max(120),
  fecha: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return new Date();
      // Los inputs datetime-local llegan sin zona horaria; se interpretan en America/Bogota (UTC-5)
      return new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(v) ? v : `${v}-05:00`);
    })
    .refine((d) => !Number.isNaN(d.getTime()), 'Fecha inválida'),
});

export async function crearReunion(_prev: string | undefined, form: FormData) {
  await soloAdmin();
  const datos = ReunionSchema.safeParse({
    nombre: form.get('nombre') ?? '',
    fecha: form.get('fecha') || undefined,
  });
  if (!datos.success) return 'Escribe un nombre de al menos 3 caracteres.';
  await db.reunion.create({ data: datos.data });
  revalidatePath(ruta);
  return 'Reunión creada.';
}

export async function eliminarReunion(id: string) {
  await soloAdmin();
  await db.reunion.deleteMany({ where: { id } });
  revalidatePath(ruta);
}

/** El becario pide un QR nuevo cada pocos segundos; el token vence en 60 s. */
export async function obtenerTokenQr() {
  const usuario = await requireModule('asistencia');
  const becario = await db.becario.findUnique({
    where: { usuarioId: usuario.id },
    select: { id: true },
  });
  if (!becario) throw new Error('Tu usuario no tiene ficha de becario.');
  return firmarToken(becario.id);
}

export type RespuestaEscaneo =
  | { estado: 'ok'; nombre: string; documento: string }
  | { estado: 'duplicado' | 'error'; mensaje: string };

const EscaneoSchema = z.object({
  reunionId: z.string().min(1),
  token: z.string().min(1).max(300),
  tipo: z.enum(['INICIO', 'FIN']),
});

export async function registrarEscaneo(entrada: {
  reunionId: string;
  token: string;
  tipo: 'INICIO' | 'FIN';
}): Promise<RespuestaEscaneo> {
  await soloAdmin();
  const datos = EscaneoSchema.safeParse(entrada);
  if (!datos.success) return { estado: 'error', mensaje: 'Datos de escaneo inválidos.' };
  const { reunionId, token, tipo } = datos.data;

  const verificado = verificarToken(token);
  if (!verificado.ok) {
    const mensajes = {
      formato: 'El código no es un QR de BECATRACK.',
      firma: 'El código no es válido.',
      vencido: 'El código venció. Pide al becario que muestre el QR actualizado.',
    } as const;
    return { estado: 'error', mensaje: mensajes[verificado.motivo] };
  }

  const [reunion, becario] = await Promise.all([
    db.reunion.findUnique({ where: { id: reunionId }, select: { id: true } }),
    db.becario.findFirst({
      where: { id: verificado.becarioId, usuario: { activo: true } },
      select: {
        id: true,
        documento: true,
        usuario: { select: { nombre: true } },
        escaneos: { where: { reunionId }, select: { tipo: true } },
      },
    }),
  ]);
  if (!reunion) return { estado: 'error', mensaje: 'La reunión no existe.' };
  if (!becario) return { estado: 'error', mensaje: 'Becario no encontrado o inactivo.' };

  const nombre = becario.usuario.nombre;
  if (tipo === 'FIN' && !becario.escaneos.some((e) => e.tipo === 'INICIO')) {
    return { estado: 'error', mensaje: `${nombre} no tiene registro de INICIO.` };
  }

  try {
    await db.escaneo.create({ data: { reunionId, becarioId: becario.id, tipo } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { estado: 'duplicado', mensaje: `${nombre} ya tiene ${tipo} en esta reunión.` };
    }
    throw e;
  }
  revalidatePath(`${ruta}/${reunionId}`);
  return { estado: 'ok', nombre, documento: becario.documento };
}
