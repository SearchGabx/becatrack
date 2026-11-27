import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Download, ScanLine } from 'lucide-react';
import { requireModule } from '@/lib/guards';
import { detalleReunion } from '@/modules/asistencia/queries';
import { ETIQUETA_ESTADO, formatoFecha } from '@/modules/asistencia/resumen';
import { AutoRefresco } from '@/modules/asistencia/components/AutoRefresco';

export const dynamic = 'force-dynamic';

const TARJETAS = [
  { clave: 'total', texto: 'Convocados', clase: 'bg-white text-[#262626]' },
  { clave: 'COMPLETA', texto: 'Completa', clase: 'bg-[#078930]/10 text-[#078930]' },
  { clave: 'PARCIAL', texto: 'Parcial', clase: 'bg-[#FCD116]/25 text-[#595959]' },
  { clave: 'AUSENTE', texto: 'Ausente', clase: 'bg-[#A3161A]/10 text-[#A3161A]' },
] as const;

export default async function ReporteReunionPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireModule('asistencia');
  if (usuario.rol !== 'ADMIN') redirect('/dashboard/asistencia');
  const { id } = await params;
  const detalle = await detalleReunion(id);
  if (!detalle) notFound();
  const { reunion, filas, conteo } = detalle;

  return (
    <section className="space-y-6">
      <AutoRefresco />
      <Link
        href="/dashboard/asistencia"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#595959] hover:text-[#A3161A]"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a reuniones
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#262626]">{reunion.nombre}</h1>
          <p className="text-sm text-[#595959]">
            {formatoFecha(reunion.fecha)} · se actualiza cada 5 segundos
          </p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <Link
            href={`/dashboard/asistencia/${reunion.id}/escanear`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3 py-2 text-white hover:bg-[#7A1013]"
          >
            <ScanLine className="h-4 w-4" /> Escanear
          </Link>
          <a
            href={`/dashboard/asistencia/${reunion.id}/exportar`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#078930] px-3 py-2 text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Descargar Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TARJETAS.map((t) => (
          <div
            key={t.clave}
            className={`rounded-xl border border-[#CCCCCC]/70 p-4 text-center shadow-sm ${t.clase}`}
          >
            <p className="text-2xl font-extrabold">{conteo[t.clave]}</p>
            <p className="text-xs font-bold uppercase tracking-wider">{t.texto}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-[#CCCCCC]/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] text-xs font-bold uppercase text-[#595959]">
            <tr>
              <th className="p-3">Becario</th>
              <th className="p-3">Inicio</th>
              <th className="p-3">Fin</th>
              <th className="p-3">Horas</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.becarioId} className="border-t border-[#CCCCCC]/50">
                <td className="p-3">
                  <p className="font-bold text-[#262626]">{f.nombre}</p>
                  <p className="text-xs text-[#595959]">Doc: {f.documento}</p>
                </td>
                <td className="p-3 text-[#595959]">{f.inicio ? formatoFecha(f.inicio) : '-'}</td>
                <td className="p-3 text-[#595959]">{f.fin ? formatoFecha(f.fin) : '-'}</td>
                <td className="p-3 font-bold">{f.horas ?? '-'}</td>
                <td className="p-3">{ETIQUETA_ESTADO[f.estado]}</td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-[#595959]">
                  No hay becarios activos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
