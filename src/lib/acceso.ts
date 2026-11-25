import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

export async function verificarAcceso(db: PrismaClient, identificador: string, password: string) {
  const login = identificador.trim();
  if (!login || !password) return null;
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
    include: { dependencia: { select: { email: true } } },
  });
  const validos = [];
  for (const usuario of candidatos) {
    if (await bcrypt.compare(password, usuario.passwordHash)) validos.push(usuario);
  }
  if (validos.length !== 1) return null;
  const { id, nombre, email, rol, dependencia } = validos[0];
  return { id, name: nombre, email: dependencia?.email ?? email, rol };
}
