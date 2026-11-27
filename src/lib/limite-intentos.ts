// Límite de intentos de inicio de sesión por usuario, en memoria.
// Suficiente para un solo contenedor en EC2; con varias instancias habría que usar la base de datos.
export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 15 * 60_000;
export const MAX_ENTRADAS = 2000;

const fallos = new Map<string, { cantidad: number; desde: number }>();

function purgarVencidos(ahora: number) {
  for (const [k, v] of fallos) {
    if (ahora - v.desde > BLOQUEO_MS) fallos.delete(k);
  }
  while (fallos.size >= MAX_ENTRADAS) {
    const primeraClave = fallos.keys().next().value;
    if (primeraClave === undefined) break;
    fallos.delete(primeraClave);
  }
}

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
  if (!f || ahora - f.desde > BLOQUEO_MS) {
    if (!f && fallos.size >= MAX_ENTRADAS) purgarVencidos(ahora);
    fallos.set(clave, { cantidad: 1, desde: ahora });
  } else {
    f.cantidad++;
  }
}

export function limpiarFallos(clave: string) {
  fallos.delete(clave);
}
