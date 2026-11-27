'use client';

import { useActionState, useState } from 'react';
import { CalendarPlus, Plus, Trash2 } from 'lucide-react';
import { crearSolicitudStaff } from '@/modules/solicitudes-staff/actions';
import { HORAS } from '@/modules/horario/constants';

interface JornadaForm {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cantidadRequerida: number;
}

export function FormSolicitudStaff({
  dependencias,
}: {
  dependencias?: { id: string; nombre: string }[];
}) {
  const [mensaje, accion, cargando] = useActionState(crearSolicitudStaff, undefined);
  const [jornadas, setJornadas] = useState<JornadaForm[]>([
    { fecha: '', horaInicio: '08:00 AM', horaFin: '12:00 PM', cantidadRequerida: 3 },
  ]);

  function actualizarJornada<K extends keyof JornadaForm>(
    idx: number,
    campo: K,
    valor: JornadaForm[K],
  ) {
    setJornadas((prev) =>
      prev.map((j, i) => (i === idx ? { ...j, [campo]: valor } : j)),
    );
  }

  function agregarJornada() {
    setJornadas((prev) => {
      const ultima = prev[prev.length - 1];
      return [
        ...prev,
        {
          fecha: ultima?.fecha ?? '',
          horaInicio: '02:00 PM',
          horaFin: '06:00 PM',
          cantidadRequerida: ultima?.cantidadRequerida ?? 3,
        },
      ];
    });
  }

  function quitarJornada(idx: number) {
    setJornadas((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  return (
    <form
      action={accion}
      className="grid gap-4 rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70"
    >
      <div>
        <h2 className="text-base font-bold text-[#262626] flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-[#A3161A]" />
          <span>Solicitar apoyo Staff (una o varias jornadas)</span>
        </h2>
        <p className="text-xs text-[#595959]">
          Indica el evento y agrega una o más jornadas con su fecha, bloque horario y
          cantidad de becarios. El administrador enviará el listado para cada jornada.
        </p>
      </div>

      <input type="hidden" name="jornadas" value={JSON.stringify(jornadas)} />

      <div className="grid gap-3 md:grid-cols-2">
        {dependencias && (
          <label className="space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
              Dependencia solicitante
            </span>
            <select
              name="dependenciaId"
              required
              className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm bg-white focus:border-[#A3161A] focus:outline-none"
            >
              {dependencias.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={`space-y-1 ${dependencias ? '' : 'md:col-span-2'}`}>
          <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
            Evento o actividad
          </span>
          <input
            name="nombreEvento"
            required
            minLength={3}
            placeholder="Ej. Jornada de Inducción / Apoyo logístico auditorio"
            className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
          />
        </label>
      </div>

      {/* Listado dinámico de jornadas */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#262626]">
            Jornadas requeridas ({jornadas.length})
          </span>
          <button
            type="button"
            onClick={agregarJornada}
            className="inline-flex items-center gap-1 rounded-lg border border-[#A3161A] bg-[#A3161A]/5 px-3 py-1.5 text-xs font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar otra jornada
          </button>
        </div>

        <div className="space-y-2.5">
          {jornadas.map((j, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-xl bg-[#F7F7F7] p-3.5 border border-[#CCCCCC]/70 md:grid-cols-[auto_1fr_1fr_1fr_130px_auto] md:items-end"
            >
              <div className="pb-2">
                <span className="inline-block rounded-full bg-[#A3161A] px-2.5 py-0.5 text-xs font-bold text-white">
                  Jornada {idx + 1}
                </span>
              </div>

              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#595959]">
                  Fecha requerida
                </span>
                <input
                  type="date"
                  required
                  value={j.fecha}
                  onChange={(e) => actualizarJornada(idx, 'fecha', e.target.value)}
                  className="w-full rounded-lg border border-[#CCCCCC] bg-white p-2 text-sm focus:border-[#A3161A] focus:outline-none"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#595959]">
                  Hora de inicio
                </span>
                <select
                  value={j.horaInicio}
                  onChange={(e) => actualizarJornada(idx, 'horaInicio', e.target.value)}
                  className="w-full rounded-lg border border-[#CCCCCC] bg-white p-2 text-sm focus:border-[#A3161A] focus:outline-none"
                >
                  {HORAS.slice(0, -1).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#595959]">
                  Hora de finalización
                </span>
                <select
                  value={j.horaFin}
                  onChange={(e) => actualizarJornada(idx, 'horaFin', e.target.value)}
                  className="w-full rounded-lg border border-[#CCCCCC] bg-white p-2 text-sm focus:border-[#A3161A] focus:outline-none"
                >
                  {HORAS.slice(1).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#595959]">
                  Cant. becarios
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={j.cantidadRequerida}
                  onChange={(e) =>
                    actualizarJornada(
                      idx,
                      'cantidadRequerida',
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                  className="w-full rounded-lg border border-[#CCCCCC] bg-white p-2 text-sm focus:border-[#A3161A] focus:outline-none"
                />
              </label>

              <div className="pb-1">
                {jornadas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarJornada(idx)}
                    title="Quitar esta jornada"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#A3161A]/10 px-2.5 py-2 text-xs font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="md:hidden">Quitar jornada</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="space-y-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-[#595959]">
          Lugar y descripción de funciones
        </span>
        <textarea
          name="descripcion"
          rows={2}
          required
          minLength={5}
          placeholder="Describe el lugar de encuentro, funciones a realizar y responsable que los recibirá..."
          className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={cargando}
        className="rounded-lg bg-[#A3161A] p-2.5 text-sm font-bold text-white hover:bg-[#7A1013] transition-colors cursor-pointer disabled:opacity-50"
      >
        {cargando ? 'Enviando solicitud...' : 'Enviar solicitud de apoyo Staff'}
      </button>

      {mensaje && (
        <p
          className={`text-sm font-medium ${
            mensaje.startsWith('Solicitud enviada') ? 'text-[#078930]' : 'text-[#A3161A]'
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}
