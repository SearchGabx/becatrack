'use client';
import { useActionState } from 'react';
import { cambiarMiClave } from '@/modules/cuenta/actions';

const campo =
  'w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none';

export function FormClave() {
  const [mensaje, accion, cargando] = useActionState(cambiarMiClave, undefined);
  const ok = mensaje === 'Contraseña actualizada.';
  return (
    <form action={accion} className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70">
      {[
        ['actual', 'Contraseña actual', 'current-password'],
        ['nueva', 'Nueva contraseña (mínimo 8 caracteres)', 'new-password'],
        ['confirmar', 'Confirmar nueva contraseña', 'new-password'],
      ].map(([name, etiqueta, auto]) => (
        <label key={name} className="block space-y-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
            {etiqueta}
          </span>
          <input name={name} type="password" autoComplete={auto} required className={campo} />
        </label>
      ))}
      <button
        disabled={cargando}
        className="w-full rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] disabled:opacity-50 cursor-pointer"
      >
        {cargando ? 'Guardando...' : 'Cambiar contraseña'}
      </button>
      {mensaje && (
        <p role="status" className={`text-sm font-medium ${ok ? 'text-[#078930]' : 'text-[#A3161A]'}`}>
          {mensaje}
        </p>
      )}
    </form>
  );
}
