import { CalendarCheck2 } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { FormStaff } from './FormStaff';

export default async function StaffPage() {
  const usuario = await requireModule('staff');
  const esAdmin = usuario.rol === 'ADMIN';

  const [eventos, becarios] = await Promise.all([
    db.evento.findMany({
      where:
        usuario.rol === 'BECARIO'
          ? { asignaciones: { some: { becario: { usuarioId: usuario.id } } } }
          : {},
      select: {
        id: true,
        nombre: true,
        fecha: true,
        lugar: true,
        cupos: true,
        asignaciones: {
          select: {
            id: true,
            funcion: true,
            horas: true,
            becario: {
              select: {
                usuarioId: true,
                usuario: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { fecha: 'asc' },
    }),
    esAdmin
      ? db.becario.findMany({
          select: {
            id: true,
            documento: true,
            usuario: { select: { nombre: true } },
          },
          orderBy: { usuario: { nombre: 'asc' } },
        })
      : Promise.resolve([]),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <CalendarCheck2 className="h-7 w-7 text-[#A3161A]" />
          <span>
            {usuario.rol === 'BECARIO' ? 'Mis asignaciones' : 'Staff y eventos'}
          </span>
        </h1>
      </div>

      {esAdmin && (
        <FormStaff
          eventos={eventos.map((e) => ({
            id: e.id,
            nombre: e.nombre,
            cupos: e.cupos,
          }))}
          becarios={becarios.map((b) => ({
            id: b.id,
            documento: b.documento,
            nombre: b.usuario.nombre,
          }))}
        />
      )}

      <div className="space-y-4">
        {eventos.map((e) => (
          <article
            key={e.id}
            className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#262626]">{e.nombre}</h2>
              <span className="rounded-full bg-[#A3161A]/10 px-3 py-0.5 text-xs font-bold text-[#A3161A]">
                {e.asignaciones.length}/{e.cupos} cupos
              </span>
            </div>
            <p className="text-sm text-[#595959]">
              {e.fecha.toLocaleDateString('es-CO')} · {e.lugar} ·{' '}
              {e.asignaciones.length}/{e.cupos} cupos
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {e.asignaciones
                .filter(
                  (a) =>
                    usuario.rol !== 'BECARIO' ||
                    a.becario.usuarioId === usuario.id,
                )
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex justify-between rounded-lg bg-[#F7F7F7] px-3 py-2"
                  >
                    <span>
                      <strong>{a.becario.usuario.nombre}</strong>: {a.funcion}
                    </span>
                    <span className="font-bold text-[#A3161A]">
                      ({Number(a.horas)} h)
                    </span>
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
