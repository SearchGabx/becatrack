// Lógica pura (sin base de datos) para poder probarla con Vitest.
export type EstadoAsistencia = 'COMPLETA' | 'PARCIAL' | 'AUSENTE';
type Tipo = 'INICIO' | 'FIN';

export function estadoAsistencia(tipos: Tipo[]): EstadoAsistencia {
  const inicio = tipos.includes('INICIO');
  const fin = tipos.includes('FIN');
  if (inicio && fin) return 'COMPLETA';
  if (inicio || fin) return 'PARCIAL';
  return 'AUSENTE';
}

export function contarAsistencia(estados: EstadoAsistencia[]) {
  const conteo = { total: estados.length, COMPLETA: 0, PARCIAL: 0, AUSENTE: 0 };
  for (const e of estados) conteo[e]++;
  return conteo;
}

/** Horas entre INICIO y FIN redondeadas a 0,5 h. `null` si falta alguno. */
export function horasEntre(inicio?: Date, fin?: Date): number | null {
  if (!inicio || !fin || fin <= inicio) return null;
  const horas = (fin.getTime() - inicio.getTime()) / 3_600_000;
  return Math.round(horas * 2) / 2;
}

export const ETIQUETA_ESTADO: Record<EstadoAsistencia, string> = {
  COMPLETA: 'Completa',
  PARCIAL: 'Parcial',
  AUSENTE: 'Ausente',
};

export function formatoFecha(fecha: Date) {
  return fecha.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
