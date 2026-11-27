import Link from 'next/link';
import { Users, Search, Eye, GraduationCap } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { FormBecario } from './FormBecario';
import { SelectorHorasMeta, SelectorPeriodoLectivo } from './CeldaAjustableCrm';

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireModule('crm');
  const { q = '' } = await searchParams;
  const termino = q.trim();

  const [becarios, registrosAgrupados, staffAgrupado, estudiantesPromo] =
    await Promise.all([
      db.becario.findMany({
        where: termino
          ? {
              OR: [
                { documento: { contains: termino, mode: 'insensitive' } },
                { programa: { contains: termino, mode: 'insensitive' } },
                { promocion: { contains: termino, mode: 'insensitive' } },
                {
                  usuario: {
                    nombre: { contains: termino, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {},
        select: {
          id: true,
          documento: true,
          promocion: true,
          programa: true,
          horasRequeridas: true,
          servicioPeriodoLectivo: true,
          usuario: { select: { nombre: true, email: true } },
        },
        orderBy: { creadoEn: 'desc' },
      }),
      db.registroHoras.groupBy({
        by: ['becarioId'],
        where: { estado: 'APROBADO' },
        _sum: { horas: true },
      }),
      db.asignacionStaff.groupBy({
        by: ['becarioId'],
        _sum: { horas: true },
      }),
      db.student.findMany({
        select: { id: true, promo: true },
      }),
    ]);

  const mapaRegistro = new Map(
    registrosAgrupados.map((r) => [r.becarioId, Number(r._sum.horas ?? 0)]),
  );
  const mapaStaff = new Map(
    staffAgrupado.map((s) => [s.becarioId, Number(s._sum.horas ?? 0)]),
  );
  const mapaPromo = new Map(estudiantesPromo.map((e) => [e.id, e.promo]));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <Users className="h-7 w-7 text-[#A3161A]" />
          <span>CRM de becarios CUC</span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">
          Ficha académica e historial de seguimiento. Crear un becario crea también su
          usuario de acceso en una sola transacción.
        </p>
      </div>

      <FormBecario />

      {/* Buscador por nombre, documento, programa o promoción */}
      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70"
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-[#595959] absolute left-3.5 top-3" />
          <input
            name="q"
            defaultValue={termino}
            placeholder="Buscar becario por nombre, documento, programa o promoción..."
            className="w-full rounded-lg border border-[#CCCCCC] pl-10 pr-4 py-2 text-sm focus:border-[#A3161A] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#A3161A] px-4 py-2 text-sm font-bold text-white hover:bg-[#7A1013] cursor-pointer"
        >
          Buscar
        </button>
        {termino && (
          <Link
            href="/dashboard/crm"
            className="text-xs font-bold text-[#595959] hover:text-[#A3161A]"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Tabla CRM de becarios */}
      <div className="rounded-xl bg-white shadow-sm border border-[#CCCCCC]/70 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] border-b border-[#CCCCCC]/70 text-xs font-bold uppercase text-[#595959]">
            <tr>
              <th className="p-3.5">Promoción</th>
              <th className="p-3.5">Documento</th>
              <th className="p-3.5">Becario</th>
              <th className="p-3.5">Programa</th>
              <th className="p-3.5">Horas de Servicio Social</th>
              <th className="p-3.5">Servicio Social del Periodo Lectivo</th>
              <th className="p-3.5 text-right">Ver ficha</th>
            </tr>
          </thead>
          <tbody>
            {becarios.map((b) => {
              const promocion = b.promocion ?? mapaPromo.get(b.documento) ?? '—';
              const horasLlevadas =
                (mapaRegistro.get(b.id) ?? 0) + (mapaStaff.get(b.id) ?? 0);

              return (
                <tr
                  key={b.id}
                  className="border-t border-[#CCCCCC]/50 hover:bg-[#F7F7F7]/50"
                >
                  <td className="p-3.5 font-semibold text-[#595959] whitespace-nowrap">
                    {promocion}
                  </td>
                  <td className="p-3.5 font-mono font-bold">{b.documento}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-[#262626]">{b.usuario.nombre}</p>
                    <p className="text-xs text-[#595959]">{b.usuario.email}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-medium flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 shrink-0 text-[#A3161A]" />
                      <span>{b.programa || 'Sin programa registrado'}</span>
                    </p>
                  </td>
                  <td className="p-3.5">
                    <SelectorHorasMeta
                      becarioId={b.id}
                      horasLlevadas={horasLlevadas}
                      horasRequeridas={b.horasRequeridas}
                    />
                  </td>
                  <td className="p-3.5">
                    <SelectorPeriodoLectivo
                      becarioId={b.id}
                      estadoInicial={b.servicioPeriodoLectivo}
                    />
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/dashboard/crm/${b.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#7A1013]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
