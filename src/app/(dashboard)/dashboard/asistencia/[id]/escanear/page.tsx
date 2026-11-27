import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { Escaner } from '@/modules/asistencia/components/Escaner';

export default async function EscanearPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireModule('asistencia');
  if (usuario.rol !== 'ADMIN') redirect('/dashboard/asistencia');
  const { id } = await params;
  const reunion = await db.reunion.findUnique({ where: { id } });
  if (!reunion) notFound();

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <Link
        href="/dashboard/asistencia"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#595959] hover:text-[#A3161A]"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a reuniones
      </Link>
      <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
        <ScanLine className="h-7 w-7 text-[#A3161A]" />
        <span>{reunion.nombre}</span>
      </h1>
      <Escaner reunionId={reunion.id} />
    </section>
  );
}
