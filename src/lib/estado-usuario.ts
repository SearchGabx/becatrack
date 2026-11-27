import { db } from './db';

export interface EstadoUsuario {
  activo: boolean;
  debeCambiarClave: boolean;
  dependenciaActiva: boolean;
}

const TTL_MS = 60_000;
const cacheEstado = new Map<string, { expira: number; valor: EstadoUsuario }>();
const enVuelo = new Map<string, Promise<EstadoUsuario>>();

export async function obtenerEstadoUsuario(userId: string): Promise<EstadoUsuario> {
  const ahora = Date.now();
  const entrada = cacheEstado.get(userId);
  if (entrada && entrada.expira > ahora) {
    return entrada.valor;
  }

  const pendiente = enVuelo.get(userId);
  if (pendiente) return pendiente;

  const promesa = (async () => {
    try {
      const usuario = await db.usuario.findUnique({
        where: { id: userId },
        select: {
          activo: true,
          debeCambiarClave: true,
          dependencia: { select: { activa: true } },
        },
      });
      const valor: EstadoUsuario = usuario
        ? {
            activo: usuario.activo,
            debeCambiarClave: usuario.debeCambiarClave,
            dependenciaActiva: Boolean(usuario.activo && usuario.dependencia?.activa),
          }
        : { activo: false, debeCambiarClave: false, dependenciaActiva: false };

      cacheEstado.set(userId, { expira: Date.now() + TTL_MS, valor });
      return valor;
    } finally {
      enVuelo.delete(userId);
    }
  })();

  enVuelo.set(userId, promesa);
  return promesa;
}

export function invalidarEstadoUsuarios(userId?: string) {
  if (userId) {
    cacheEstado.delete(userId);
    enVuelo.delete(userId);
  } else {
    cacheEstado.clear();
    enVuelo.clear();
  }
}
