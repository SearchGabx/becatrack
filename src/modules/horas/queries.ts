import { db } from '@/lib/db';

export async function resumenHoras(becarioId: string) {
  const [becario, registro, staff] = await Promise.all([
    db.becario.findUniqueOrThrow({
      where: { id: becarioId },
      include: { usuario: true },
    }),
    db.registroHoras.aggregate({
      where: { becarioId, estado: 'APROBADO' },
      _sum: { horas: true },
    }),
    db.asignacionStaff.aggregate({
      where: { becarioId },
      _sum: { horas: true },
    }),
  ]);
  const horasRegistro = Number(registro._sum.horas ?? 0);
  const horasStaff = Number(staff._sum.horas ?? 0);
  const total = horasRegistro + horasStaff;
  const porcentaje = Math.min(
    100,
    Math.round((total / becario.horasRequeridas) * 100),
  );
  return {
    becario,
    horasRegistro,
    horasStaff,
    total,
    requeridas: becario.horasRequeridas,
    porcentaje,
  };
}
