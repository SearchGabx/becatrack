export type ColorSemaforo = 'verde' | 'amarillo' | 'rojo';
const DIA_MS = 86_400_000;

export function colorSemaforo(
  fechaLimite: Date,
  estado: string,
  hoy = new Date(),
): ColorSemaforo {
  if (estado === 'COMPLETADA') return 'verde';
  const diasRestantes = Math.ceil(
    (fechaLimite.getTime() - hoy.getTime()) / DIA_MS,
  );
  if (diasRestantes < 0) return 'rojo';
  if (diasRestantes <= 3) return 'amarillo';
  return 'verde';
}

export const CLASE_COLOR: Record<ColorSemaforo, string> = {
  verde: 'bg-[#078930]',
  amarillo: 'bg-[#FCD116]',
  rojo: 'bg-[#A3161A]',
};
