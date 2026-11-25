'use client';
import { useActionState } from 'react';
import { crearTarea } from '@/modules/tareas/actions';

type Props = {
  becarios: { id: string; nombre: string; documento: string }[];
};

export function FormTarea({ becarios }: Props) {
  const [mensaje, accion, cargando] = useActionState(crearTarea, undefined);

  return (
    <form
      action={accion}
      className="grid gap-3 rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <h2 className="text-base font-bold text-[#262626]">
          Asignar nueva tarea a un becario
        </h2>
      </div>
      <select
        name="becarioId"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
      >
        {becarios.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nombre} ({b.documento})
          </option>
        ))}
      </select>
      <input
        name="titulo"
        placeholder="Título de la tarea"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="fechaLimite"
        type="date"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="descripcion"
        placeholder="Descripción (opcional)"
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm md:col-span-2 focus:border-[#A3161A] focus:outline-none"
      />
      <button
        disabled={cargando}
        className="rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] cursor-pointer"
      >
        {cargando ? 'Guardando...' : 'Crear tarea'}
      </button>
      {mensaje && (
        <p className="text-xs font-bold text-[#078930] md:col-span-3">
          {mensaje}
        </p>
      )}
    </form>
  );
}
