'use client';
import { useEffect, useRef, useState } from 'react';
import { registrarEscaneo, type RespuestaEscaneo } from '../actions';

type Tipo = 'INICIO' | 'FIN';
type Entrada = RespuestaEscaneo & { tipo: Tipo; hora: string };

const PAUSA_MS = 1500;

export function Escaner({ reunionId }: { reunionId: string }) {
  const [tipo, setTipo] = useState<Tipo>('INICIO');
  const [log, setLog] = useState<Entrada[]>([]);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const tipoRef = useRef(tipo);

  useEffect(() => {
    tipoRef.current = tipo;
  }, [tipo]);

  useEffect(() => {
    let cancelado = false;
    let limpiar: (() => void) | undefined;

    // html5-qrcode usa APIs del navegador: se carga solo en el cliente.
    import('html5-qrcode')
      .then(({ Html5QrcodeScanner }) => {
        if (cancelado) return;
        const scanner = new Html5QrcodeScanner('lector-qr', { fps: 10, qrbox: 250 }, false);

        // pause/resume solo aplican con la cámara; con imagen subida lanzan error.
        const pausar = () => {
          try {
            scanner.pause(true);
          } catch {}
        };
        const reanudar = () => {
          try {
            scanner.resume();
          } catch {}
        };

        async function alLeer(texto: string) {
          pausar();
          const tipoActual = tipoRef.current;
          let respuesta: RespuestaEscaneo;
          try {
            respuesta = await registrarEscaneo({ reunionId, token: texto, tipo: tipoActual });
          } catch {
            respuesta = { estado: 'error', mensaje: 'Error de red o de sesión.' };
          }
          const hora = new Date().toLocaleTimeString('es-CO');
          setLog((prev) => [{ ...respuesta, tipo: tipoActual, hora }, ...prev].slice(0, 50));
          setTimeout(reanudar, PAUSA_MS);
        }

        scanner.render(alLeer, () => {
          // Se dispara en cada cuadro sin QR válido: se ignora.
        });
        limpiar = () => {
          scanner.clear().catch(() => {});
        };
      })
      .catch(() => setErrorCamara('No se pudo iniciar el lector de QR.'));

    return () => {
      cancelado = true;
      limpiar?.();
    };
  }, [reunionId]);

  const claseBoton = (t: Tipo) =>
    `flex-1 rounded-full px-4 py-2.5 text-sm font-bold cursor-pointer ${
      tipo === t ? 'bg-[#A3161A] text-white shadow-sm' : 'text-[#595959]'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex max-w-xs rounded-full bg-[#F7F7F7] border border-[#CCCCCC]/70 p-1">
        <button type="button" onClick={() => setTipo('INICIO')} className={claseBoton('INICIO')}>
          Inicio
        </button>
        <button type="button" onClick={() => setTipo('FIN')} className={claseBoton('FIN')}>
          Fin
        </button>
      </div>
      <p className="text-sm text-[#595959]">
        Registrando: <strong className="text-[#A3161A]">{tipo}</strong>
      </p>

      {errorCamara && <p className="text-sm font-medium text-[#A3161A]">{errorCamara}</p>}
      <div id="lector-qr" className="overflow-hidden rounded-2xl border border-[#CCCCCC]/70 bg-white" />

      <div>
        <h2 className="mb-2 font-bold text-[#262626]">Últimos escaneos</h2>
        <ul className="space-y-2 text-sm">
          {log.map((e, i) => (
            <li
              key={i}
              className={`rounded-xl px-4 py-2.5 font-medium ${
                e.estado === 'ok'
                  ? 'bg-[#078930]/10 text-[#078930]'
                  : e.estado === 'duplicado'
                    ? 'bg-[#FCD116]/25 text-[#595959]'
                    : 'bg-[#A3161A]/10 text-[#A3161A]'
              }`}
            >
              {e.hora} ·{' '}
              {e.estado === 'ok' ? `${e.nombre} (${e.documento}) · ${e.tipo}` : e.mensaje}
            </li>
          ))}
          {log.length === 0 && <li className="text-[#A5A5A5]">Aún no hay escaneos.</li>}
        </ul>
      </div>
    </div>
  );
}
