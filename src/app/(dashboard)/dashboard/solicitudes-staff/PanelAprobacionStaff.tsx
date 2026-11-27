'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  ClipboardPaste,
  ExternalLink,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  aprobarSolicitudStaff,
  rechazarSolicitudStaff,
  eliminarSolicitudStaff,
} from '@/modules/solicitudes-staff/actions';
import type {
  BecarioDisponibleDTO,
  JornadaSolicitudDTO,
} from '@/modules/solicitudes-staff/queries';

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function PanelAprobacionStaff({
  solicitudId,
  jornadas,
  catalogoBecarios,
  estadoActual,
  observacionActual,
}: {
  solicitudId: string;
  jornadas: JornadaSolicitudDTO[];
  catalogoBecarios: BecarioDisponibleDTO[];
  estadoActual: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  observacionActual: string | null;
}) {
  const [abierto, setAbierto] = useState(estadoActual === 'PENDIENTE');
  const [seleccionPorJornada, setSeleccionPorJornada] = useState<
    Record<string, string[]>
  >(() => {
    const inicial: Record<string, string[]> = {};
    for (const j of jornadas) {
      inicial[j.id] = j.asignados.map((b) => b.id);
    }
    return inicial;
  });
  const [textoPegado, setTextoPegado] = useState<Record<string, string>>({});
  const [avisoJornada, setAvisoJornada] = useState<Record<string, string>>({});
  const [selectorManual, setSelectorManual] = useState<Record<string, string>>({});
  const [observacion, setObservacion] = useState(observacionActual ?? '');
  const [avisoGlobal, setAvisoGlobal] = useState<{
    ok: boolean;
    texto: string;
  } | null>(null);
  const [pendiente, startTransition] = useTransition();

  const { mapaPorId, mapaPorDoc, mapaPorNombre } = useMemo(() => {
    const porId = new Map<string, BecarioDisponibleDTO>();
    const porDoc = new Map<string, BecarioDisponibleDTO>();
    const porNombre = new Map<string, BecarioDisponibleDTO>();
    for (const b of catalogoBecarios) {
      porId.set(b.id, b);
      porDoc.set(b.documento.trim(), b);
      porNombre.set(normalizarTexto(b.nombre), b);
    }
    return { mapaPorId: porId, mapaPorDoc: porDoc, mapaPorNombre: porNombre };
  }, [catalogoBecarios]);

  function procesarTextoPegado(jornadaId: string, raw: string) {
    const lineas = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const encontrados: string[] = [];

    for (const linea of lineas) {
      // Ignora encabezado de "Copiar seleccionados" en Horario y Disponibilidad
      if (/^prom\t/i.test(linea) || /nombre\tdocumento/i.test(linea)) {
        continue;
      }

      let becario: BecarioDisponibleDTO | undefined;

      // 1. Formato TSV de "Copiar seleccionados": Prom \t Nombre \t Documento \t Correo \t Contacto
      if (linea.includes('\t')) {
        const cols = linea.split('\t').map((c) => c.trim());
        for (const col of cols) {
          if (mapaPorDoc.has(col)) {
            becario = mapaPorDoc.get(col);
            break;
          }
        }
        if (!becario && cols[1]) {
          becario = mapaPorNombre.get(normalizarTexto(cols[1]));
        }
      }

      // 2. Búsqueda por número de documento en cualquier parte de la línea
      if (!becario) {
        const docs = linea.match(/\b\d{5,15}\b/g) ?? [];
        for (const d of docs) {
          if (mapaPorDoc.has(d)) {
            becario = mapaPorDoc.get(d);
            break;
          }
        }
      }

      // 3. Búsqueda por nombre completo
      if (!becario) {
        becario = mapaPorNombre.get(normalizarTexto(linea));
      }

      if (becario && !encontrados.includes(becario.id)) {
        encontrados.push(becario.id);
      }
    }

    if (encontrados.length === 0) {
      setAvisoJornada((prev) => ({
        ...prev,
        [jornadaId]:
          'No se detectaron becarios válidos en el texto pegado. Copia las filas desde Horario y Disponibilidad.',
      }));
      return;
    }

    setSeleccionPorJornada((prev) => {
      const actuales = prev[jornadaId] ?? [];
      const combinados = Array.from(new Set([...actuales, ...encontrados]));
      return { ...prev, [jornadaId]: combinados };
    });
    setTextoPegado((prev) => ({ ...prev, [jornadaId]: '' }));
    setAvisoJornada((prev) => ({
      ...prev,
      [jornadaId]: `✓ Se cargaron ${encontrados.length} becario(s) desde el portapapeles.`,
    }));
  }

  async function pegarDesdePortapapeles(jornadaId: string) {
    try {
      const texto = await navigator.clipboard.readText();
      if (!texto.trim()) {
        setAvisoJornada((prev) => ({
          ...prev,
          [jornadaId]: 'El portapapeles está vacío.',
        }));
        return;
      }
      procesarTextoPegado(jornadaId, texto);
    } catch {
      setAvisoJornada((prev) => ({
        ...prev,
        [jornadaId]:
          'Pega el listado directamente con Ctrl+V dentro del recuadro de texto.',
      }));
    }
  }

  function agregarManual(jornadaId: string) {
    const id = selectorManual[jornadaId];
    if (!id) return;
    setSeleccionPorJornada((prev) => {
      const actuales = prev[jornadaId] ?? [];
      if (actuales.includes(id)) return prev;
      return { ...prev, [jornadaId]: [...actuales, id] };
    });
    setSelectorManual((prev) => ({ ...prev, [jornadaId]: '' }));
  }

  function quitarDeJornada(jornadaId: string, becarioId: string) {
    setSeleccionPorJornada((prev) => ({
      ...prev,
      [jornadaId]: (prev[jornadaId] ?? []).filter((id) => id !== becarioId),
    }));
  }

  function vaciarJornada(jornadaId: string) {
    setSeleccionPorJornada((prev) => ({ ...prev, [jornadaId]: [] }));
    setAvisoJornada((prev) => ({ ...prev, [jornadaId]: '' }));
  }

  function aprobar() {
    setAvisoGlobal(null);
    startTransition(async () => {
      const res = await aprobarSolicitudStaff({
        solicitudId,
        asignacionesPorJornada: jornadas.map((j) => ({
          jornadaId: j.id,
          becarioIds: seleccionPorJornada[j.id] ?? [],
        })),
        observacionAdmin: observacion,
      });
      setAvisoGlobal({ ok: res.ok, texto: res.mensaje });
      if (res.ok) setAbierto(false);
    });
  }

  function rechazar() {
    setAvisoGlobal(null);
    startTransition(async () => {
      const res = await rechazarSolicitudStaff({
        solicitudId,
        observacionAdmin: observacion,
      });
      setAvisoGlobal({ ok: res.ok, texto: res.mensaje });
      if (res.ok) setAbierto(false);
    });
  }

  function eliminar() {
    if (!window.confirm('¿Eliminar definitivamente esta solicitud de apoyo Staff?')) {
      return;
    }
    setAvisoGlobal(null);
    startTransition(async () => {
      await eliminarSolicitudStaff(solicitudId);
    });
  }

  const totalCargados = jornadas.reduce(
    (acc, j) => acc + (seleccionPorJornada[j.id]?.length ?? 0),
    0,
  );

  return (
    <div className="mt-4 border-t border-[#CCCCCC]/60 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="text-xs font-bold text-[#A3161A] hover:underline cursor-pointer"
        >
          {abierto
            ? 'Ocultar apartados de carga y aprobación'
            : `Gestionar solicitud y pegar listados por jornada (${jornadas.length} jornada(s))`}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/dashboard/horario"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-[#A3161A] bg-white px-2.5 py-1 text-xs font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white transition-colors"
          >
            <span>Abrir Horario y Disponibilidad</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            disabled={pendiente}
            onClick={eliminar}
            className="inline-flex items-center gap-1 rounded-lg border border-[#CCCCCC] bg-white px-2.5 py-1 text-xs font-bold text-[#595959] hover:border-[#A3161A] hover:text-[#A3161A] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar solicitud</span>
          </button>
        </div>
      </div>

      {abierto && (
        <div className="mt-3 space-y-4 rounded-xl bg-[#F7F7F7] p-4 border border-[#CCCCCC]/70">
          <p className="text-xs text-[#595959]">
            Ve a <strong>Horario y Disponibilidad</strong>, filtra cada día/rango horario,
            marca los becarios, haz clic en <strong>&ldquo;Copiar seleccionados&rdquo;</strong>{' '}
            y pégalos en el apartado de la jornada correspondiente:
          </p>

          <div className="space-y-4">
            {jornadas.map((j) => {
              const idsSeleccionados = seleccionPorJornada[j.id] ?? [];
              const becariosSeleccionados = idsSeleccionados
                .map((id) => mapaPorId.get(id))
                .filter((b): b is BecarioDisponibleDTO => Boolean(b));
              const textoActual = textoPegado[j.id] ?? '';
              const disponiblesParaManual = catalogoBecarios.filter(
                (b) => !idsSeleccionados.includes(b.id),
              );

              return (
                <div
                  key={j.id}
                  className="rounded-xl bg-white p-4 shadow-sm border border-[#CCCCCC]/70 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CCCCCC]/50 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#A3161A] px-2.5 py-0.5 text-xs font-bold text-white">
                        Jornada {j.orden}
                      </span>
                      <span className="text-xs font-extrabold text-[#262626]">
                        {j.fechaTexto} ({j.diaSemana}) · {j.horaInicio} a {j.horaFin}
                      </span>
                    </div>
                    <span className="rounded-full bg-[#A3161A]/10 px-2.5 py-0.5 text-xs font-bold text-[#A3161A]">
                      Cargados: {becariosSeleccionados.length} / {j.cantidadRequerida}{' '}
                      requerido(s)
                    </span>
                  </div>

                  {/* Área de pegado manual desde "Copiar seleccionados" */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#262626]">
                        Pegar seleccionados de Horario y Disponibilidad para esta jornada
                      </label>
                      <button
                        type="button"
                        onClick={() => pegarDesdePortapapeles(j.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#7A1013] cursor-pointer"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        Pegar del portapapeles
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        rows={2}
                        value={textoActual}
                        onChange={(e) =>
                          setTextoPegado((prev) => ({
                            ...prev,
                            [j.id]: e.target.value,
                          }))
                        }
                        onPaste={(e) => {
                          const clip = e.clipboardData.getData('text');
                          if (clip && clip.trim()) {
                            e.preventDefault();
                            procesarTextoPegado(j.id, clip);
                          }
                        }}
                        placeholder="Pega aquí (Ctrl+V) las filas copiadas con 'Copiar seleccionados' desde Horario y Disponibilidad..."
                        className="flex-1 rounded-lg border border-[#CCCCCC] p-2 text-xs font-mono focus:border-[#A3161A] focus:outline-none"
                      />
                      {textoActual.trim() && (
                        <button
                          type="button"
                          onClick={() => procesarTextoPegado(j.id, textoActual)}
                          className="shrink-0 rounded-lg bg-[#262626] px-3 py-2 text-xs font-bold text-white hover:bg-black cursor-pointer"
                        >
                          Cargar texto
                        </button>
                      )}
                    </div>

                    {avisoJornada[j.id] && (
                      <p
                        className={`text-xs font-semibold ${
                          avisoJornada[j.id].startsWith('✓')
                            ? 'text-[#078930]'
                            : 'text-[#A3161A]'
                        }`}
                      >
                        {avisoJornada[j.id]}
                      </p>
                    )}
                  </div>

                  {/* Selector manual complementario */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      aria-label={`Agregar becario manualmente a Jornada ${j.orden}`}
                      value={selectorManual[j.id] ?? ''}
                      onChange={(e) =>
                        setSelectorManual((prev) => ({
                          ...prev,
                          [j.id]: e.target.value,
                        }))
                      }
                      className="flex-1 min-w-[220px] rounded-lg border border-[#CCCCCC] bg-white p-2 text-xs focus:border-[#A3161A] focus:outline-none"
                    >
                      <option value="">
                        + O agregar un becario individualmente a esta jornada...
                      </option>
                      {disponiblesParaManual.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre} — Doc: {b.documento} ({b.programa})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectorManual[j.id]}
                      onClick={() => agregarManual(j.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#A3161A] px-3 py-2 text-xs font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white disabled:opacity-40 cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Añadir
                    </button>
                    {becariosSeleccionados.length > 0 && (
                      <button
                        type="button"
                        onClick={() => vaciarJornada(j.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#CCCCCC] px-2.5 py-2 text-xs font-semibold text-[#595959] hover:text-[#A3161A] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Vaciar jornada
                      </button>
                    )}
                  </div>

                  {/* Tabla de becarios cargados para esta jornada */}
                  {becariosSeleccionados.length === 0 ? (
                    <p className="rounded-lg bg-[#F7F7F7] p-3 text-xs text-[#595959] text-center">
                      Aún no has pegado ni seleccionado becarios para la Jornada {j.orden}.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#CCCCCC]/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7F7F7] border-b border-[#CCCCCC]/60 font-bold text-[#595959]">
                          <tr>
                            <th className="p-2">Prom</th>
                            <th className="p-2">Nombre</th>
                            <th className="p-2">Documento</th>
                            <th className="p-2">Correo / Contacto</th>
                            <th className="p-2 text-right">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#CCCCCC]/40">
                          {becariosSeleccionados.map((b) => (
                            <tr key={b.id}>
                              <td className="p-2 font-semibold text-[#595959]">
                                {b.promocion ?? '—'}
                              </td>
                              <td className="p-2 font-bold text-[#262626]">{b.nombre}</td>
                              <td className="p-2 font-mono">{b.documento}</td>
                              <td className="p-2 text-[#595959]">
                                {[b.correo, b.contacto].filter(Boolean).join(' · ') || '—'}
                              </td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => quitarDeJornada(j.id, b.id)}
                                  className="rounded bg-[#A3161A]/10 px-2 py-0.5 text-[11px] font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white cursor-pointer"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <input
            type="text"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Nota u observación opcional para la dependencia..."
            className="w-full rounded-lg border border-[#CCCCCC] bg-white p-2 text-xs focus:border-[#A3161A] focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pendiente || totalCargados === 0}
              onClick={aprobar}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#078930] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {pendiente
                ? 'Enviando...'
                : `Aprobar y enviar listado por jornada (${totalCargados} asignado(s))`}
            </button>
            <button
              type="button"
              disabled={pendiente}
              onClick={rechazar}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3161A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#7A1013] disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              Rechazar solicitud
            </button>
          </div>

          {avisoGlobal && (
            <p
              className={`text-xs font-bold ${
                avisoGlobal.ok ? 'text-[#078930]' : 'text-[#A3161A]'
              }`}
            >
              {avisoGlobal.texto}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
