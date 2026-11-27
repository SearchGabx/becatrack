import Link from 'next/link';
import QRCode from 'qrcode';
import { QrCode, ScanLine, BarChart3 } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { historialBecarioPorId } from '@/modules/asistencia/queries';
import { firmarToken } from '@/modules/asistencia/token';
import { ETIQUETA_ESTADO, formatoFecha } from '@/modules/asistencia/resumen';
import { MiQr } from '@/modules/asistencia/components/MiQr';
import { FormReunion } from '@/modules/asistencia/components/FormReunion';
import { BotonEliminar } from '@/modules/asistencia/components/BotonEliminar';

const COLOR_ESTADO = {
  COMPLETA: 'bg-[#078930]/15 text-[#078930]',
  PARCIAL: 'bg-[#FCD116]/30 text-[#595959]',
  AUSENTE: 'bg-[#A3161A]/15 text-[#A3161A]',
} as const;

function Encabezado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
        <QrCode className="h-7 w-7 text-[#A3161A]" />
        <span>{titulo}</span>
      </h1>
      <p className="mt-1 text-sm text-[#595959]">{texto}</p>
    </div>
  );
}

export default async function AsistenciaPage() {
  const usuario = await requireModule('asistencia');

  if (usuario.rol === 'BECARIO') {
    const becario = await db.becario.findUnique({
      where: { usuarioId: usuario.id },
      select: { id: true, documento: true },
    });
    const [historial, imagenInicial] = becario
      ? await Promise.all([
          historialBecarioPorId(becario.id),
          QRCode.toDataURL(firmarToken(becario.id), { width: 300, margin: 2 }),
        ])
      : [[], null];
    return (
      <section className="space-y-6">
        <Encabezado
          titulo="Mi QR de asistencia"
          texto="Muéstralo al administrador al inicio y al final de cada reunión."
        />
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70">
          {becario ? (
            <MiQr documento={becario.documento} imagenInicial={imagenInicial} />
          ) : (
            <p className="text-sm text-[#595959]">Tu usuario no tiene ficha de becario.</p>
          )}
        </div>
        <div className="rounded-xl bg-white shadow-sm border border-[#CCCCCC]/70">
          <h2 className="p-4 font-bold text-[#262626] border-b border-[#CCCCCC]/50">
            Mi historial
          </h2>
          <ul className="divide-y divide-[#CCCCCC]/50 text-sm">
            {historial.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold text-[#262626]">{r.nombre}</p>
                  <p className="text-xs text-[#595959]">{formatoFecha(r.fecha)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COLOR_ESTADO[r.estado]}`}>
                  {ETIQUETA_ESTADO[r.estado]}
                </span>
              </li>
            ))}
            {historial.length === 0 && (
              <li className="p-4 text-[#595959]">Aún no hay reuniones registradas.</li>
            )}
          </ul>
        </div>
      </section>
    );
  }

  const reuniones = await db.reunion.findMany({
    orderBy: { fecha: 'desc' },
    include: { _count: { select: { escaneos: true } } },
  });

  return (
    <section className="space-y-6">
      <Encabezado
        titulo="Asistencia y QR"
        texto="Crea una reunión, escanea el QR de cada becario al inicio y al final, y descarga el reporte."
      />
      <FormReunion />
      <ul className="space-y-3">
        {reuniones.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70"
          >
            <div>
              <p className="font-bold text-[#262626]">{r.nombre}</p>
              <p className="text-xs text-[#595959]">
                {formatoFecha(r.fecha)} · {r._count.escaneos} escaneo(s)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Link
                href={`/dashboard/asistencia/${r.id}/escanear`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3 py-2 text-white hover:bg-[#7A1013]"
              >
                <ScanLine className="h-4 w-4" /> Escanear
              </Link>
              <Link
                href={`/dashboard/asistencia/${r.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F7F7] border border-[#CCCCCC] px-3 py-2 text-[#262626] hover:border-[#A3161A]"
              >
                <BarChart3 className="h-4 w-4" /> Reporte
              </Link>
              <BotonEliminar id={r.id} nombre={r.nombre} />
            </div>
          </li>
        ))}
        {reuniones.length === 0 && (
          <li className="rounded-xl bg-white p-6 text-sm text-[#595959] shadow-sm border border-[#CCCCCC]/70">
            Aún no hay reuniones. Crea la primera con el formulario.
          </li>
        )}
      </ul>
    </section>
  );
}
