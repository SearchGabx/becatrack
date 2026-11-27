'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { RefreshCw } from 'lucide-react';
import { obtenerTokenQr } from '../actions';

const RENOVACION_MS = 25_000; // igual a RENOVACION_TOKEN_MS en token.ts

export function MiQr({ documento }: { documento: string }) {
  const [imagen, setImagen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(RENOVACION_MS / 1000);

  useEffect(() => {
    let activo = true;
    async function renovar() {
      try {
        const token = await obtenerTokenQr();
        const url = await QRCode.toDataURL(token, { width: 300, margin: 2 });
        if (activo) {
          setImagen(url);
          setError(null);
          setSegundos(RENOVACION_MS / 1000);
        }
      } catch {
        if (activo) setError('No se pudo generar el código. Revisa tu conexión.');
      }
    }
    renovar();
    const renovacion = setInterval(renovar, RENOVACION_MS);
    const reloj = setInterval(() => setSegundos((s) => Math.max(0, s - 1)), 1000);
    return () => {
      activo = false;
      clearInterval(renovacion);
      clearInterval(reloj);
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-2xl border border-[#CCCCCC]/70 bg-white p-4 shadow-sm">
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagen} alt="Tu código QR de asistencia" width={300} height={300} />
        ) : (
          <div className="h-[300px] w-[300px] animate-pulse rounded-xl bg-[#F7F7F7]" />
        )}
      </div>
      <span className="mt-4 rounded-full bg-[#A3161A]/10 px-4 py-1.5 text-sm font-bold text-[#A3161A]">
        Documento: {documento}
      </span>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#595959]">
        <RefreshCw className="h-3.5 w-3.5" />
        El código se renueva en {segundos} s. Las capturas de pantalla no sirven.
      </p>
      {error && <p className="mt-2 text-sm font-medium text-[#A3161A]">{error}</p>}
    </div>
  );
}
