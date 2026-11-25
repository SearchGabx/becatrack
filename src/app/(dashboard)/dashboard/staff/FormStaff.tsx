'use client';
import { useActionState } from 'react';
import { CalendarPlus, UserCheck } from 'lucide-react';
import { crearEvento, asignarBecario } from '@/modules/staff/actions';

type Props = {
  eventos: { id: string; nombre: string; cupos: number }[];
  becarios: { id: string; documento: string; nombre: string }[];
};

export function FormStaff({ eventos, becarios }: Props) {
  const [msgEv, accionEv, cargandoEv] = useActionState(crearEvento, undefined);
  const [msgAsg, accionAsg, cargandoAsg] = useActionState(
    asignarBecario,
    undefined,
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        action={accionEv}
        className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 space-y-3"
      >
        <h2 className="text-base font-bold text-[#262626] flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-[#A3161A]" />
          <span>Crear evento institucional</span>
        </h2>
        <input
          name="nombre"
          placeholder="Nombre del evento"
          required
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="fecha"
            type="date"
            required
            className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
          <input
            name="cupos"
            type="number"
            min="1"
            placeholder="Cupos"
            required
            className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
        </div>
        <input
          name="lugar"
          placeholder="Lugar del evento"
          required
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
        <button
          disabled={cargandoEv}
          className="w-full rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] cursor-pointer"
        >
          {cargandoEv ? 'Creando...' : 'Crear evento'}
        </button>
        {msgEv && <p className="text-xs font-bold text-[#078930]">{msgEv}</p>}
      </form>

      <form
        action={accionAsg}
        className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 space-y-3"
      >
        <h2 className="text-base font-bold text-[#262626] flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#A3161A]" />
          <span>Asignar becario a Staff</span>
        </h2>
        <select
          name="eventoId"
          required
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
        >
          {eventos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} ({e.cupos} cupos)
            </option>
          ))}
        </select>
        <select
          name="becarioId"
          required
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
        >
          {becarios.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre} ({b.documento})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input
            name="funcion"
            placeholder="Función (logística, protocolo...)"
            required
            className="col-span-2 rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
          <input
            name="horas"
            type="number"
            step="0.5"
            min="0.5"
            placeholder="Horas"
            required
            className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
        </div>
        <button
          disabled={cargandoAsg}
          className="w-full rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] cursor-pointer"
        >
          {cargandoAsg ? 'Asignando...' : 'Asignar becario'}
        </button>
        {msgAsg && (
          <p
            className={`text-xs font-bold ${
              msgAsg.includes('asignado') ? 'text-[#078930]' : 'text-[#A3161A]'
            }`}
          >
            {msgAsg}
          </p>
        )}
      </form>
    </div>
  );
}
