'use client';
import { useActionState } from 'react';
import { UserPlus } from 'lucide-react';
import { crearBecario } from '@/modules/crm/actions';

export function FormBecario() {
  const [mensaje, accion, cargando] = useActionState(crearBecario, undefined);
  return (
    <form
      action={accion}
      className="grid gap-3 rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 md:grid-cols-3"
    >
      <div className="md:col-span-3">
        <h2 className="text-base font-bold text-[#262626] flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#A3161A]" />
          <span>Registrar nuevo becario en el CRM</span>
        </h2>
        <p className="text-xs text-[#595959]">
          Crea la ficha académica y su usuario con rol <code>BECARIO</code> en una sola
          transacción (contraseña inicial = documento).
        </p>
      </div>
      <input
        name="nombre"
        placeholder="Nombre completo"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="email"
        type="email"
        placeholder="Correo institucional"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="documento"
        placeholder="Documento (mín. 5 dígitos)"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="programa"
        placeholder="Programa académico"
        required
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <input
        name="promocion"
        placeholder="Promoción (ej. 2026)"
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="telefono"
          placeholder="Teléfono"
          className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
        <input
          name="horasRequeridas"
          type="number"
          defaultValue={100}
          min="1"
          placeholder="Horas req."
          required
          className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
      </div>
      <button
        disabled={cargando}
        className="rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] transition-colors md:col-span-3 cursor-pointer"
      >
        {cargando ? 'Creando becario...' : 'Crear becario'}
      </button>
      {mensaje && (
        <p
          className={`text-sm font-medium md:col-span-3 ${
            mensaje === 'Becario creado.' ? 'text-[#078930]' : 'text-[#A3161A]'
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}
