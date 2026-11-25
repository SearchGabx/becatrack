import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  IdCard,
  MessageSquarePlus,
} from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { agregarSeguimiento } from '@/modules/crm/actions';
import { resumenHoras } from '@/modules/horas/queries';
import { BarraProgreso } from '@/components/ui/BarraProgreso';

export default async function FichaBecario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModule('crm');
  const { id } = await params;
  const [becario, resumen] = await Promise.all([
    db.becario.findUniqueOrThrow({
      where: { id },
      include: {
        usuario: true,
        seguimientos: { orderBy: { fecha: 'desc' } },
      },
    }),
    resumenHoras(id),
  ]);

  return (
    <section className="space-y-6">
      <Link
        href="/dashboard/crm"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#A3161A] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al listado CRM
      </Link>

      {/* Ficha académica y progreso de horas */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#262626]">
              {becario.usuario.nombre}
            </h1>
            <span className="rounded-full bg-[#A3161A] px-3 py-0.5 text-xs font-bold text-white">
              BECARIO CUC
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 text-sm text-[#595959]">
            <p className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-[#A3161A]" />
              <span>
                Documento:{' '}
                <strong className="text-[#262626]">{becario.documento}</strong>
              </span>
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#A3161A]" />
              <span>
                {becario.programa} · Semestre {becario.semestre}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#A3161A]" />
              <span>{becario.usuario.email}</span>
            </p>
            {becario.telefono && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#A3161A]" />
                <span>{becario.telefono}</span>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#F7F7F7] p-4 border border-[#CCCCCC]/70 flex flex-col justify-between">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span>Progreso Horas</span>
            <span>
              {resumen.total} / {resumen.requeridas} h ({resumen.porcentaje}%)
            </span>
          </div>
          <BarraProgreso porcentaje={resumen.porcentaje} />
          <p className="mt-2 text-xs text-[#595959]">
            Dependencias: {resumen.horasRegistro} h · Staff: {resumen.horasStaff} h
          </p>
        </div>
      </div>

      {/* Formulario agregarSeguimiento y bitácora de contacto */}
      <div className="grid gap-6 md:grid-cols-3">
        <form
          action={agregarSeguimiento.bind(null, becario.id)}
          className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 space-y-3 h-fit"
        >
          <h2 className="text-base font-bold text-[#262626] flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-[#A3161A]" />
            <span>Registrar seguimiento</span>
          </h2>
          <select
            name="tipo"
            defaultValue="reunión"
            className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
          >
            <option value="llamada">Llamada</option>
            <option value="reunión">Reunión</option>
            <option value="correo">Correo</option>
            <option value="observación">Observación</option>
          </select>
          <textarea
            name="nota"
            rows={4}
            required
            placeholder="Detalle del contacto o seguimiento..."
            className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] cursor-pointer"
          >
            Guardar seguimiento
          </button>
        </form>

        <div className="md:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-[#262626]">
            Historial de seguimientos ({becario.seguimientos.length})
          </h2>
          {becario.seguimientos.map((s) => (
            <article
              key={s.id}
              className="rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70 border-l-4 border-l-[#A3161A]"
            >
              <div className="flex justify-between items-center">
                <span className="rounded-full bg-[#A3161A]/10 px-2.5 py-0.5 text-xs font-bold uppercase text-[#A3161A]">
                  {s.tipo}
                </span>
                <span className="text-xs text-[#595959]">
                  {s.fecha.toLocaleDateString('es-CO')}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#262626]">{s.nota}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
