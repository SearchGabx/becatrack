'use client';
import { useActionState } from 'react';
import { registrarHoras } from '@/modules/horas/actions';

type Props = {
  dependencias?: { id: string; nombre: string }[]; // solo para el admin
};

export function FormRegistro({ dependencias }: Props) {
  const [mensaje, accion, cargando] = useActionState(registrarHoras, undefined);
  return (
    <form
      action={accion}
      className="grid gap-3 rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <h2 className="text-base font-bold text-[#262626]">
          Registrar nuevas horas sociales
        </h2>
        <p className="text-xs text-[#595959]">
          Ingresa el documento del becario (ej. <code>1000000000</code>), fecha, horas
          (0.5 a 12) y actividad realizada.
        </p>
      </div>
      <input
        name="documento"
        placeholder="Documento del becario"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="fecha"
        type="date"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="horas"
        type="number"
        step="0.5"
        min="0.5"
        max="12"
        placeholder="Horas"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      {dependencias && (
        <select
          name="dependenciaId"
          className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
        >
          {dependencias.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      )}
      <textarea
        name="actividad"
        placeholder="Actividad realizada"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm md:col-span-2 focus:border-[#A3161A] focus:outline-none"
      />
      <button
        disabled={cargando}
        className="rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] transition-colors md:col-span-2 cursor-pointer"
      >
        {cargando ? 'Registrando...' : 'Registrar horas'}
      </button>
      {mensaje && (
        <p
          className={`text-sm font-medium md:col-span-2 ${
            mensaje.includes('guardado') ? 'text-[#078930]' : 'text-[#A3161A]'
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}
