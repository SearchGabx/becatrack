'use client';
import { useActionState } from 'react';
import { registrarHoras } from '@/modules/horas/actions';

type BecarioAsignado = {
  id: string;
  documento: string;
  nombre: string;
  programa: string;
};

type Props = {
  dependencias?: { id: string; nombre: string }[]; // solo para el admin
  becariosAsignados?: BecarioAsignado[]; // solo para la dependencia
};

export function FormRegistro({ dependencias, becariosAsignados }: Props) {
  const [mensaje, accion, cargando] = useActionState(registrarHoras, undefined);
  const esDependencia = becariosAsignados !== undefined;
  const sinAsignados = esDependencia && becariosAsignados.length === 0;

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
          {esDependencia
            ? 'Selecciona el becario asignado a tu dependencia, fecha, horas (0.5 a 12) y actividad realizada.'
            : 'Ingresa el documento del becario (ej. 1000000000), fecha, horas (0.5 a 12) y actividad realizada.'}
        </p>
      </div>
      {esDependencia ? (
        <select
          name="documento"
          required
          disabled={sinAsignados}
          defaultValue=""
          className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none disabled:bg-[#F7F7F7] disabled:text-[#595959]"
        >
          <option value="" disabled>
            {sinAsignados
              ? 'No tienes becarios asignados aún'
              : 'Selecciona un becario asignado...'}
          </option>
          {becariosAsignados.map((b) => (
            <option key={b.id} value={b.documento}>
              {b.nombre} — Doc: {b.documento}
              {b.programa ? ` (${b.programa})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          name="documento"
          placeholder="Documento del becario"
          required
          className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
      )}
      <input
        name="fecha"
        type="date"
        required
        disabled={sinAsignados}
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none disabled:bg-[#F7F7F7]"
      />
      <input
        name="horas"
        type="number"
        step="0.5"
        min="0.5"
        max="12"
        placeholder="Horas"
        required
        disabled={sinAsignados}
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none disabled:bg-[#F7F7F7]"
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
        disabled={sinAsignados}
        className="rounded-lg border border-[#CCCCCC] p-2.5 text-sm md:col-span-2 focus:border-[#A3161A] focus:outline-none disabled:bg-[#F7F7F7]"
      />
      {sinAsignados && (
        <p className="text-xs font-medium text-[#A3161A] md:col-span-2">
          Aún no tienes estudiantes asignados por el administrador para el servicio social.
        </p>
      )}
      <button
        disabled={cargando || sinAsignados}
        className="rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] transition-colors md:col-span-2 cursor-pointer disabled:opacity-50"
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
