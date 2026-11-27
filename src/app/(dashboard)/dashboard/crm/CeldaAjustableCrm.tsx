'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import {
  actualizarHorasRequeridas,
  actualizarServicioPeriodo,
} from '@/modules/crm/actions';

export function SelectorHorasMeta({
  becarioId,
  horasLlevadas,
  horasRequeridas,
}: {
  becarioId: string;
  horasLlevadas: number;
  horasRequeridas: number;
}) {
  const [meta, setMeta] = useState(String(horasRequeridas));
  const [guardado, setGuardado] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const metaNum = Number(meta);
  const cambioPendiente =
    !Number.isNaN(metaNum) && metaNum >= 1 && metaNum !== horasRequeridas;

  function guardar() {
    if (!cambioPendiente) return;
    startTransition(async () => {
      const res = await actualizarHorasRequeridas(becarioId, metaNum);
      if (res.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 1800);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="font-bold text-[#262626]">{horasLlevadas}</span>
      <span className="text-[#595959]">/</span>
      <input
        type="number"
        min={1}
        max={1000}
        aria-label="Meta de horas de servicio social"
        value={meta}
        onChange={(e) => {
          setMeta(e.target.value);
          setGuardado(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            guardar();
          }
        }}
        className="w-16 rounded border border-[#CCCCCC] bg-white px-2 py-1 text-center text-xs font-bold text-[#262626] focus:border-[#A3161A] focus:outline-none"
      />
      <span className="text-xs text-[#595959]">h</span>
      {cambioPendiente && (
        <button
          type="button"
          onClick={guardar}
          disabled={pendiente}
          title="Guardar meta de horas"
          className="rounded bg-[#A3161A] px-2 py-1 text-[11px] font-bold text-white hover:bg-[#7A1013] disabled:opacity-50 cursor-pointer"
        >
          {pendiente ? '...' : 'OK'}
        </button>
      )}
      {guardado && (
        <Check className="h-3.5 w-3.5 text-[#078930]" aria-label="Guardado" />
      )}
    </div>
  );
}

const CLASE_PERIODO: Record<string, string> = {
  Cumplido: 'border-[#078930]/40 bg-[#078930]/10 text-[#078930]',
  'En curso': 'border-[#C9A227]/50 bg-[#FCD116]/20 text-[#262626]',
  Pendiente: 'border-[#A3161A]/40 bg-[#A3161A]/10 text-[#A3161A]',
  Exonerado: 'border-[#CCCCCC] bg-[#F7F7F7] text-[#595959]',
};

export function SelectorPeriodoLectivo({
  becarioId,
  estadoInicial,
}: {
  becarioId: string;
  estadoInicial: string;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [pendiente, startTransition] = useTransition();

  function alCambiar(nuevo: string) {
    setEstado(nuevo);
    startTransition(async () => {
      await actualizarServicioPeriodo(becarioId, nuevo);
    });
  }

  return (
    <select
      aria-label="Servicio Social del Periodo Lectivo"
      value={estado}
      disabled={pendiente}
      onChange={(e) => alCambiar(e.target.value)}
      className={`rounded-full border px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer disabled:opacity-60 ${
        CLASE_PERIODO[estado] ?? CLASE_PERIODO['En curso']
      }`}
    >
      <option value="En curso">En curso</option>
      <option value="Cumplido">Cumplido</option>
      <option value="Pendiente">Pendiente</option>
      <option value="Exonerado">Exonerado</option>
    </select>
  );
}
