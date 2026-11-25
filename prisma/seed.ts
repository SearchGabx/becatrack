import { PrismaClient, Prisma, type Usuario, type Schedule } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const db = new PrismaClient();
type Tx = Prisma.TransactionClient;

async function guardarUsuario(
  tx: Tx,
  anterior: Usuario | null,
  nombre: string,
  clave: string,
  rol: Usuario['rol'],
  email: string | null,
  activo = true,
) {
  if (anterior && anterior.rol !== rol) throw new Error('Conflicto de rol. Carga cancelada.');
  const passwordHash =
    anterior && (await bcrypt.compare(clave, anterior.passwordHash))
      ? anterior.passwordHash
      : await bcrypt.hash(clave, 10);
  const data = { nombre, rol, email, activo, passwordHash };
  return anterior
    ? tx.usuario.update({ where: { id: anterior.id }, data })
    : tx.usuario.create({ data });
}

function claveHorario({ id, ...campos }: Schedule) {
  void id;
  return JSON.stringify(Object.entries(campos).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const url = process.env.HORARIO_DATABASE_URL;
  const adminPassword = process.env.BECATRACK_ADMIN_PASSWORD;
  if (!url || !adminPassword)
    throw new Error('Configura HORARIO_DATABASE_URL y BECATRACK_ADMIN_PASSWORD.');
  const source = new PrismaClient({ datasourceUrl: url });
  const students = await source
    .$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        return tx.student.findMany({ include: { schedules: true } });
      },
      { isolationLevel: 'RepeatableRead' },
    )
    .finally(() => source.$disconnect());
  if (!students.length) throw new Error('El padrón de origen está vacío.');
  const emailCounts = new Map<string, number>();
  for (const s of students) {
    const email = s.correo?.trim().toLowerCase() ?? '';
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }
  let pendientes = 0;
  await db.$transaction(
    async (tx) => {
      const admin = await tx.usuario.findFirst({
        where: { rol: 'ADMIN' },
        orderBy: [{ activo: 'desc' }, { creadoEn: 'asc' }],
      });
      await guardarUsuario(
        tx,
        admin,
        'Administrador',
        adminPassword,
        'ADMIN',
        admin?.email ?? null,
      );
      for (const { schedules, ...s } of students) {
        await tx.student.upsert({ where: { id: s.id }, create: s, update: s });
        const ficha = await tx.becario.findUnique({
          where: { documento: s.id },
          include: { usuario: true },
        });
        const correo = s.correo?.trim().toLowerCase() ?? '';
        const conflicto =
          correo &&
          (await tx.usuario.findFirst({
            where: {
              email: { equals: correo, mode: 'insensitive' },
              ...(ficha && { id: { not: ficha.usuarioId } }),
            },
          }));
        const activo =
          z.string().email().safeParse(correo).success &&
          emailCounts.get(correo) === 1 &&
          !conflicto;
        if (!activo) pendientes++;
        const user = await guardarUsuario(
          tx,
          ficha?.usuario ?? null,
          s.nombre_completo,
          s.id,
          'BECARIO',
          activo ? correo : null,
          activo,
        );
        const data = {
          programa: s.programa ?? ficha?.programa ?? '',
          telefono: s.contacto ?? ficha?.telefono,
        };
        await tx.becario.upsert({
          where: { documento: s.id },
          update: data,
          create: { ...data, documento: s.id, usuarioId: user.id },
        });
        const existentes = new Map<string, number>();
        for (const h of await tx.schedule.findMany({ where: { studentId: s.id } })) {
          const k = claveHorario(h);
          existentes.set(k, (existentes.get(k) ?? 0) + 1);
        }
        const nuevos = schedules
          .filter((h) => {
            const k = claveHorario(h);
            const n = existentes.get(k) ?? 0;
            if (n) existentes.set(k, n - 1);
            return n === 0;
          })
          .map(({ id, ...campos }) => {
            void id;
            return campos;
          });
        if (nuevos.length) await tx.schedule.createMany({ data: nuevos });
      }
    },
    { isolationLevel: 'Serializable', timeout: 180000 },
  );
  console.log({
    estudiantes: students.length,
    horarios: students.reduce((n, s) => n + s.schedules.length, 0),
    dependencias: await db.dependencia.count({ where: { activa: true } }),
    correosPendientes: pendientes,
  });
}

main()
  .catch((e) => {
    console.error(e.code ?? e.name, 'No se completó la carga.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
