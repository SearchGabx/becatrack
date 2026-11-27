import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { bloqueado, limpiarFallos, registrarFallo } from './limite-intentos';

export async function verificarAcceso(db: PrismaClient, identificador: string, password: string) {
  const login = identificador.trim();
  if (!login || !password) return null;
  const clave = login.toLowerCase();
  if (bloqueado(clave)) return null;
  const usuario = await buscarUsuario(db, login, password);
  if (usuario) limpiarFallos(clave);
  else registrarFallo(clave);
  return usuario;
}

async function buscarUsuario(db: PrismaClient, login: string, password: string) {
  const correo = { equals: login, mode: 'insensitive' as const };
  const filtro =
    login.toLowerCase() === 'admin'
      ? { rol: 'ADMIN' as const }
      : {
          OR: [
            { rol: 'BECARIO' as const, email: correo },
            { rol: 'DEPENDENCIA' as const, dependencia: { activa: true, email: correo } },
          ],
        };
  const candidatos = await db.usuario.findMany({
    where: { ...filtro, activo: true },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      passwordHash: true,
      dependencia: { select: { email: true } },
    },
  });
  if (candidatos.length === 0) return null;

  const hashesUnicos = Array.from(new Set(candidatos.map((u) => u.passwordHash)));
  const resultadosHash = new Map<string, boolean>(
    await Promise.all(
      hashesUnicos.map(async (hash) => [hash, await bcrypt.compare(password, hash)] as const),
    ),
  );
  const validos = candidatos.filter((u) => resultadosHash.get(u.passwordHash));
  if (validos.length !== 1) return null;
  const { id, nombre, email, rol, dependencia } = validos[0];
  return { id, name: nombre, email: dependencia?.email ?? email, rol };
}
