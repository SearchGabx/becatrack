import Link from 'next/link';
import { Users, Search, Eye, GraduationCap } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { FormBecario } from './FormBecario';

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireModule('crm');
  const { q = '' } = await searchParams;
  const termino = q.trim();

  const becarios = await db.becario.findMany({
    where: termino
      ? {
          OR: [
            { documento: { contains: termino, mode: 'insensitive' } },
            { programa: { contains: termino, mode: 'insensitive' } },
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
      programa: true,
      semestre: true,
      horasRequeridas: true,
      usuario: { select: { nombre: true, email: true } },
      _count: { select: { seguimientos: true } },
    },
    orderBy: { creadoEn: 'desc' },
  });

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

      {/* Buscador por nombre o documento (Paso 5.6) */}
      <form
        method="GET"
        className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70"
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-[#595959] absolute left-3.5 top-3" />
          <input
            name="q"
            defaultValue={termino}
            placeholder="Buscar becario por nombre, documento o programa..."
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
              <th className="p-3.5">Becario</th>
              <th className="p-3.5">Documento</th>
              <th className="p-3.5">Programa / Semestre</th>
              <th className="p-3.5">Meta Horas</th>
              <th className="p-3.5">Seguimientos</th>
              <th className="p-3.5 text-right">Ficha</th>
            </tr>
          </thead>
          <tbody>
            {becarios.map((b) => (
              <tr
                key={b.id}
                className="border-t border-[#CCCCCC]/50 hover:bg-[#F7F7F7]/50"
              >
                <td className="p-3.5">
                  <p className="font-bold text-[#262626]">{b.usuario.nombre}</p>
                  <p className="text-xs text-[#595959]">{b.usuario.email}</p>
                </td>
                <td className="p-3.5 font-mono font-bold">{b.documento}</td>
                <td className="p-3.5">
                  <p className="font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-[#A3161A]" />
                    {b.programa}
                  </p>
                  <p className="text-xs text-[#595959]">Semestre {b.semestre}</p>
                </td>
                <td className="p-3.5 font-semibold">{b.horasRequeridas} h</td>
                <td className="p-3.5">
                  <span className="rounded-full bg-[#A3161A]/10 px-2.5 py-0.5 text-xs font-bold text-[#A3161A]">
                    {b._count.seguimientos} nota(s)
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <Link
                    href={`/dashboard/crm/${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#7A1013]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver ficha
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
