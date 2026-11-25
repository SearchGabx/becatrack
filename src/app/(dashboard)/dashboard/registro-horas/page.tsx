import { FilePlus2 } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { cambiarEstadoRegistro } from '@/modules/horas/actions';
import { FormRegistro } from './FormRegistro';

export default async function RegistroHorasPage() {
  const usuario = await requireModule('registroHoras');
  const esAdmin = usuario.rol === 'ADMIN';

  const registros = await db.registroHoras.findMany({
    where: esAdmin ? {} : { dependencia: { usuarioId: usuario.id } },
    include: {
      becario: { include: { usuario: true } },
      dependencia: true,
    },
    orderBy: { creadoEn: 'desc' },
  });
  const dependencias = esAdmin
    ? await db.dependencia.findMany({ where: { activa: true } })
    : undefined;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <FilePlus2 className="h-7 w-7 text-[#A3161A]" />
          <span>Registro de horas sociales</span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">
          La dependencia registra horas a un becario por su documento; el registro queda
          PENDIENTE hasta que el admin lo aprueba.
        </p>
      </div>

      <FormRegistro dependencias={dependencias} />

      <div className="rounded-xl bg-white shadow-sm border border-[#CCCCCC]/70 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] border-b border-[#CCCCCC]/70 text-xs font-bold uppercase text-[#595959]">
            <tr>
              <th className="p-3.5">Becario</th>
              <th className="p-3.5">Dependencia</th>
              <th className="p-3.5">Fecha</th>
              <th className="p-3.5">Actividad</th>
              <th className="p-3.5">Horas</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[#CCCCCC]/50 hover:bg-[#F7F7F7]/50"
              >
                <td className="p-3.5">
                  <p className="font-bold text-[#262626]">
                    {r.becario.usuario.nombre}
                  </p>
                  <p className="text-xs text-[#595959]">Doc: {r.becario.documento}</p>
                </td>
                <td className="p-3.5 font-medium">{r.dependencia.nombre}</td>
                <td className="p-3.5 text-[#595959]">
                  {r.fecha.toLocaleDateString('es-CO')}
                </td>
                <td className="p-3.5 text-xs text-[#595959] max-w-xs">
                  {r.actividad}
                </td>
                <td className="p-3.5 font-bold">{Number(r.horas)} h</td>
                <td className="p-3.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.estado === 'APROBADO'
                        ? 'bg-[#078930]/15 text-[#078930]'
                        : r.estado === 'RECHAZADO'
                          ? 'bg-[#A3161A]/15 text-[#A3161A]'
                          : 'bg-[#FCD116]/30 text-[#595959]'
                    }`}
                  >
                    {r.estado}
                  </span>
                </td>
                <td className="p-3.5 space-x-2 whitespace-nowrap">
                  {esAdmin && r.estado === 'PENDIENTE' && (
                    <>
                      <form
                        action={cambiarEstadoRegistro.bind(
                          null,
                          r.id,
                          'APROBADO',
                        )}
                        className="inline"
                      >
                        <button className="rounded bg-[#078930] px-2.5 py-1 text-xs font-bold text-white cursor-pointer">
                          Aprobar
                        </button>
                      </form>
                      <form
                        action={cambiarEstadoRegistro.bind(
                          null,
                          r.id,
                          'RECHAZADO',
                        )}
                        className="inline"
                      >
                        <button className="rounded bg-[#A3161A] px-2.5 py-1 text-xs font-bold text-white cursor-pointer">
                          Rechazar
                        </button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
