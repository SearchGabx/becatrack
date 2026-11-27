import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { obtenerEstadoUsuario } from './estado-usuario';
import { puede, type Modulo } from './permissions';

export const getSession = cache(() => auth());

export async function requireModule(modulo: Modulo) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  if (!puede(session.user.rol, modulo)) redirect('/dashboard');
  if (session.user.rol === 'DEPENDENCIA') {
    const estado = await obtenerEstadoUsuario(session.user.id);
    if (!estado.dependenciaActiva) redirect('/login');
  }
  return session.user;
}
