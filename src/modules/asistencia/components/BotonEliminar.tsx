'use client';
import { Trash2 } from 'lucide-react';
import { eliminarReunion } from '../actions';

export function BotonEliminar({ id, nombre }: { id: string; nombre: string }) {
  return (
    <form
      action={eliminarReunion.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar "${nombre}" y todos sus escaneos? No se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        className="rounded-lg p-2 text-[#A5A5A5] hover:bg-[#A3161A]/10 hover:text-[#A3161A] cursor-pointer"
        aria-label={`Eliminar ${nombre}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
