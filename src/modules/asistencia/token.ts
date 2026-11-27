import { createHmac, timingSafeEqual } from 'node:crypto';

// El QR no lleva el documento en claro: lleva un token firmado que vence pronto.
// Así una captura de pantalla o un QR generado a mano con la cédula no sirven.
export const VIGENCIA_TOKEN_MS = 60_000;
export const RENOVACION_TOKEN_MS = 25_000;

function secreto(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('Falta AUTH_SECRET para firmar los códigos QR.');
  return s;
}

function firma(datos: string, clave: string) {
  return createHmac('sha256', clave).update(datos).digest('base64url');
}

export function firmarToken(becarioId: string, ahora = Date.now(), clave = secreto()) {
  const datos = `${becarioId}.${ahora + VIGENCIA_TOKEN_MS}`;
  return `${datos}.${firma(datos, clave)}`;
}

export type ResultadoToken =
  | { ok: true; becarioId: string }
  | { ok: false; motivo: 'formato' | 'firma' | 'vencido' };

export function verificarToken(
  token: string,
  ahora = Date.now(),
  clave = secreto(),
): ResultadoToken {
  const partes = token.trim().split('.');
  if (partes.length !== 3) return { ok: false, motivo: 'formato' };
  const [becarioId, expira, recibida] = partes;
  const vence = Number(expira);
  if (!becarioId || !Number.isFinite(vence)) return { ok: false, motivo: 'formato' };

  const esperada = Buffer.from(firma(`${becarioId}.${expira}`, clave));
  const dada = Buffer.from(recibida);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) {
    return { ok: false, motivo: 'firma' };
  }
  if (vence < ahora) return { ok: false, motivo: 'vencido' };
  return { ok: true, becarioId };
}
