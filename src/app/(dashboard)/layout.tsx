import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const usuario = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { debeCambiarClave: true },
  });

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar
        rol={session.user.rol}
        nombre={session.user.name}
        email={session.user.email}
      />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {usuario?.debeCambiarClave && (
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
