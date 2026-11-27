// Límite de intentos de inicio de sesión por usuario, en memoria.
// Suficiente para un solo contenedor en EC2; con varias instancias habría que usar la base de datos.
export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 15 * 60_000;

const fallos = new Map<string, { cantidad: number; desde: number }>();

export function bloqueado(clave: string, ahora = Date.now()): boolean {
  const f = fallos.get(clave);
  if (!f) return false;
  if (ahora - f.desde > BLOQUEO_MS) {
    fallos.delete(clave);
    return false;
  }
  return f.cantidad >= MAX_FALLOS;
}

export function registrarFallo(clave: string, ahora = Date.now()) {
  const f = fallos.get(clave);
  if (!f || ahora - f.desde > BLOQUEO_MS) fallos.set(clave, { cantidad: 1, desde: ahora });
  else f.cantidad++;
}

export function limpiarFallos(clave: string) {
  fallos.delete(clave);
}
