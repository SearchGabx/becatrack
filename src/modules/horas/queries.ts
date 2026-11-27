import { db } from '@/lib/db';

export async function resumenHoras(becarioId: string) {
  const [becario, registro, staff] = await Promise.all([
    db.becario.findUniqueOrThrow({
      where: { id: becarioId },
      select: {
        id: true,
        documento: true,
        programa: true,
        semestre: true,
        horasRequeridas: true,
        usuario: { select: { nombre: true, email: true } },
      },
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

/**
 * Obtiene el resumen de horas de todos los becarios (o de un usuario específico)
 * en solo 3 consultas agregadas en paralelo en lugar de 3*N consultas (N+1).
 */
export async function resumenHorasListado(usuarioId?: string) {
  const filtroBecario = usuarioId ? { usuarioId } : undefined;
  const [becarios, registrosAgrupados, staffAgrupado] = await Promise.all([
    db.becario.findMany({
      where: filtroBecario,
      orderBy: { usuario: { nombre: 'asc' } },
      select: {
        id: true,
        documento: true,
        programa: true,
        semestre: true,
        horasRequeridas: true,
        usuario: { select: { nombre: true } },
      },
    }),
    db.registroHoras.groupBy({
      by: ['becarioId'],
      where: {
        estado: 'APROBADO',
        ...(usuarioId ? { becario: { usuarioId } } : {}),
      },
      _sum: { horas: true },
    }),
    db.asignacionStaff.groupBy({
      by: ['becarioId'],
      where: usuarioId ? { becario: { usuarioId } } : undefined,
      _sum: { horas: true },
    }),
  ]);

  const mapaRegistro = new Map(
    registrosAgrupados.map((r) => [r.becarioId, Number(r._sum.horas ?? 0)]),
  );
  const mapaStaff = new Map(
    staffAgrupado.map((s) => [s.becarioId, Number(s._sum.horas ?? 0)]),
  );

  return becarios.map((becario) => {
    const horasRegistro = mapaRegistro.get(becario.id) ?? 0;
    const horasStaff = mapaStaff.get(becario.id) ?? 0;
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
  });
}
