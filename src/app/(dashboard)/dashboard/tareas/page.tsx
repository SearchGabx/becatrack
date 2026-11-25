import { ListTodo } from 'lucide-react';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';
import { cambiarEstadoTarea } from '@/modules/tareas/actions';
import { colorSemaforo, CLASE_COLOR } from '@/modules/tareas/semaforo';
import { FormTarea } from './FormTarea';

export default async function TareasPage() {
  await requireModule('tareas');
  const [tareas, becarios] = await Promise.all([
    db.tarea.findMany({
      include: { becario: { include: { usuario: true } } },
      orderBy: { fechaLimite: 'asc' },
    }),
    db.becario.findMany({ include: { usuario: true } }),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
            <ListTodo className="h-7 w-7 text-[#A3161A]" />
            <span>Tareas pendientes (Semáforo)</span>
          </h1>
          <p className="mt-1 text-sm text-[#595959]">
            Verde si está completada o faltan más de 3 días, amarillo si vence en 3 días
            o menos, rojo si ya venció.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-sm border border-[#CCCCCC]/70 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-[#078930]" /> Verde
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-[#FCD116]" /> Amarillo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full bg-[#A3161A]" /> Rojo
          </span>
        </div>
      </div>

      <FormTarea
        becarios={becarios.map((b) => ({
          id: b.id,
          nombre: b.usuario.nombre,
          documento: b.documento,
        }))}
      />

      <ul className="space-y-2.5">
        {tareas.map((t) => {
          const color = colorSemaforo(t.fechaLimite, t.estado);
          return (
            <li
              key={t.id}
              className="flex items-center gap-3.5 rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70"
            >
              <span
                className={`h-4 w-4 shrink-0 rounded-full ${CLASE_COLOR[color]}`}
                title={color}
              />
              <div className="flex-1">
                <p className="font-bold text-[#262626]">{t.titulo}</p>
                {t.descripcion && (
                  <p className="text-xs text-[#595959]">{t.descripcion}</p>
                )}
                <p className="text-xs text-[#595959] mt-0.5">
                  {t.becario.usuario.nombre} · vence{' '}
                  {t.fechaLimite.toLocaleDateString('es-CO')}
                </p>
              </div>
              {t.estado !== 'COMPLETADA' && (
                <form
                  action={cambiarEstadoTarea.bind(null, t.id, 'COMPLETADA')}
                >
                  <button className="rounded-lg bg-[#078930] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 cursor-pointer">
                    Marcar completada
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
