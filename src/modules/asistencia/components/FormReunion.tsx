'use client';
import { useActionState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { crearReunion } from '../actions';

export function FormReunion() {
  const [mensaje, accion, cargando] = useActionState(crearReunion, undefined);
  return (
    <form
      action={accion}
      className="grid gap-3 rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 md:grid-cols-[1fr_auto_auto] md:items-end"
    >
      <label className="space-y-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
          Nombre de la reunión
        </span>
        <input
          name="nombre"
          required
          minLength={3}
          placeholder="Ej. Reunión general de becarios"
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
      </label>
      <label className="space-y-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
          Fecha y hora (opcional)
        </span>
        <input
          name="fecha"
          type="datetime-local"
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
      </label>
      <button
        disabled={cargando}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A3161A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#7A1013] disabled:opacity-50 cursor-pointer"
      >
        <CalendarPlus className="h-4 w-4" />
        {cargando ? 'Creando...' : 'Crear reunión'}
      </button>
      {mensaje && (
        <p
          className={`text-sm font-medium md:col-span-3 ${
            mensaje.endsWith('creada.') ? 'text-[#078930]' : 'text-[#A3161A]'
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}
