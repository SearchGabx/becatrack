import Link from 'next/link';
import { redirect } from 'next/navigation';
import { obtenerEstadoUsuario } from '@/lib/estado-usuario';
import { getSession } from '@/lib/guards';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const estado = await obtenerEstadoUsuario(session.user.id);

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar
        rol={session.user.rol}
        nombre={session.user.name}
        email={session.user.email}
      />
      <main className="flex-1 min-w-0 px-4 pb-6 pt-20 sm:px-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {estado.debeCambiarClave && (
            <div className="mb-6 rounded-xl border border-[#C9A227] bg-[#FCD116]/20 p-4 text-sm text-[#262626]">
              Estás usando una contraseña inicial.{' '}
              <Link href="/dashboard/cuenta" className="font-bold text-[#A3161A] underline">
                Cámbiala ahora
              </Link>
              .
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
