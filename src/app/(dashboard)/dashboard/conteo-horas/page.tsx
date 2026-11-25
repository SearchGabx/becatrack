import { Clock, CheckCircle2, CalendarCheck2 } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { resumenHoras } from '@/modules/horas/queries';
import { BarraProgreso } from '@/components/ui/BarraProgreso';

export default async function ConteoHorasPage() {
  const usuario = await requireModule('conteoHoras');

  const becarios =
    usuario.rol === 'BECARIO'
      ? await db.becario.findMany({ where: { usuarioId: usuario.id } })
      : await db.becario.findMany();
  const resumenes = await Promise.all(
    becarios.map((b) => resumenHoras(b.id)),
  );

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <Clock className="h-7 w-7 text-[#A3161A]" />
          <span>Conteo de horas sociales</span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">
          Suma las horas aprobadas en Registro de horas más las horas de Staff, contra
          las horas requeridas del becario.
        </p>
      </div>

      {resumenes.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 text-sm text-[#595959]">
          No hay becarios registrados aún.
        </div>
      ) : (
        resumenes.map((r) => (
          <div
            key={r.becario.id}
            className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-[#262626]">
                  {r.becario.usuario.nombre}
                </span>
                <span className="ml-2 rounded-full bg-[#A3161A]/10 px-2.5 py-0.5 text-xs font-bold text-[#A3161A]">
                  Doc: {r.becario.documento}
                </span>
                <p className="text-xs text-[#595959]">
                  {r.becario.programa} · Semestre {r.becario.semestre}
                </p>
              </div>
              <span className="text-base font-extrabold text-[#262626]">
                {r.total} / {r.requeridas} h ({r.porcentaje}%)
              </span>
            </div>
            <BarraProgreso porcentaje={r.porcentaje} />
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#595959]">
              <span className="inline-flex items-center gap-1 font-medium text-[#078930]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dependencias (Aprobadas): <strong>{r.horasRegistro} h</strong>
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-[#A3161A]">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                Staff Eventos: <strong>{r.horasStaff} h</strong>
              </span>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
