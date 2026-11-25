import { QrCode, Info } from 'lucide-react';
import { requireModule } from '@/lib/guards';

export default async function AsistenciaPage() {
  await requireModule('asistencia');
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm border border-[#CCCCCC]/70">
      <div className="flex items-center gap-3 text-[#A3161A]">
        <QrCode className="h-8 w-8" />
        <h1 className="text-2xl font-extrabold text-[#262626]">
          Asistencia y QR
        </h1>
      </div>
      <p className="mt-2 text-[#595959]">
        Módulo existente: pendiente de integración.
      </p>
      <div className="mt-6 rounded-xl bg-[#A3161A]/5 border border-[#A3161A]/20 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#A3161A] shrink-0 mt-0.5" />
        <p className="text-xs text-[#595959]">
          Ruta protegida con <code>await requireModule(&apos;asistencia&apos;)</code> (accesible
          para ADMIN y BECARIO). Cuando se integre el proyecto existente, se copian sus
          componentes a <code>src/modules/asistencia</code>.
        </p>
      </div>
    </section>
  );
}
