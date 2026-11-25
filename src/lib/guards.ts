import { redirect } from 'next/navigation';
import { db } from './db';
import { auth } from '@/auth';
import { puede, type Modulo } from './permissions';

export async function requireModule(modulo: Modulo) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!puede(session.user.rol, modulo)) redirect('/dashboard');
  if (session.user.rol === 'DEPENDENCIA') {
    const activa = await db.dependencia.findFirst({
      where: { usuarioId: session.user.id, activa: true, usuario: { activo: true } },
      select: { id: true },
    });
    if (!activa) redirect('/login');
  }
  return session.user;
}
