import { Building2 } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { alternarActiva } from '@/modules/dependencias/actions';
import {
  FormDependencia,
  FormClave,
  AdministrarDependencia,
} from './FormDependencia';

export default async function DependenciasPage() {
  await requireModule('dependencias');
  const dependencias = await db.dependencia.findMany({
    where: { OR: [{ activa: true }, { usuarioId: { not: null } }, { email: { not: null } }] },
    include: { _count: { select: { registros: true } } },
    orderBy: { nombre: 'asc' },
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-[#A3161A]" />
          <span>Perfiles de dependencias</span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">
          Unidades académicas y administrativas de la CUC habilitadas para el registro de horas
          sociales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormDependencia />
        <FormClave />
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-[#CCCCCC]/70 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F7F7] border-b border-[#CCCCCC]/70 text-xs font-bold uppercase text-[#595959]">
            <tr>
              <th className="p-3.5">Nombre</th>
              <th className="p-3.5">Responsable</th>
              <th className="p-3.5">Correo</th>
              <th className="p-3.5">Registros</th>
              <th className="p-3.5">Estado</th>
              <th className="p-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {dependencias.map((d) => (
              <tr key={d.id} className="border-t border-[#CCCCCC]/50 hover:bg-[#F7F7F7]/50">
                <td className="p-3.5 font-bold text-[#262626]">{d.nombre}</td>
                <td className="p-3.5 text-[#595959]">{d.responsable}</td>
                <td className="p-3.5 text-[#595959]">{d.email}</td>
                <td className="p-3.5 font-semibold">{d._count.registros}</td>
                <td className="p-3.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      d.activa ? 'bg-[#078930]/15 text-[#078930]' : 'bg-[#595959]/15 text-[#595959]'
                    }`}
                  >
                    {d.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <AdministrarDependencia
                    perfil={{
                      id: d.id,
                      nombre: d.nombre,
                      responsable: d.responsable,
                      email: d.email,
                    }}
                    tieneUsuario={Boolean(d.usuarioId)}
                  />
                  {d.usuarioId && (
                    <form action={alternarActiva.bind(null, d.id, d.activa)}>
                      <button
                        className={`rounded-lg px-3 py-1 text-xs font-bold cursor-pointer ${
                          d.activa
                            ? 'border border-[#A3161A] text-[#A3161A] hover:bg-[#A3161A] hover:text-white'
                            : 'bg-[#078930] text-white'
                        }`}
                      >
                        {d.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
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
