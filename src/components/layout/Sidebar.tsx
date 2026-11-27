import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  QrCode,
  Clock,
  FilePlus2,
  Building2,
  CalendarCheck2,
  ListTodo,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { signOut } from '@/auth';
import { MODULOS, PERMISOS, type Modulo, type Rol } from '@/lib/permissions';
import { CucLogo } from '@/components/ui/CucLogo';
import { SidebarShell, NavLink } from './SidebarShell';

const ICONOS_MODULO: Record<Modulo, React.ReactNode> = {
  crm: <Users className="h-4 w-4" />,
  horario: <CalendarClock className="h-4 w-4" />,
  asistencia: <QrCode className="h-4 w-4" />,
  conteoHoras: <Clock className="h-4 w-4" />,
  registroHoras: <FilePlus2 className="h-4 w-4" />,
  dependencias: <Building2 className="h-4 w-4" />,
  staff: <CalendarCheck2 className="h-4 w-4" />,
  tareas: <ListTodo className="h-4 w-4" />,
};

export function Sidebar({
  rol,
  nombre,
  email,
}: {
  rol: Rol;
  nombre?: string | null;
  email?: string | null;
}) {
  const modulos = PERMISOS[rol];

  return (
    <SidebarShell>
      <div className="h-full overflow-y-auto bg-[#A3161A] text-white flex flex-col justify-between shadow-xl border-r border-[#7A1013]">
        <div>
          {/* Bloque de marca oficial CUC: Imagotipo blanco sobre fondo Auburn (#A3161A) */}
          <div className="p-5 border-b border-white/15">
            <Link href="/dashboard" className="block">
              <CucLogo variant="white" className="h-10" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest uppercase text-[#FCD116]">
                  BECATRACK · SAAS
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {rol}
                </span>
              </div>
            </Link>
          </div>

          {/* Menú filtrado por rol desde src/lib/permissions.ts */}
          <div className="p-4">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Menú de navegación ({rol})
            </p>
            <nav className="space-y-1">
              <NavLink href="/dashboard" exacto>
                <LayoutDashboard className="h-4 w-4" />
                <span>Inicio</span>
              </NavLink>

              {modulos.map((m) => (
                <NavLink key={m} href={MODULOS[m].ruta}>
                  {ICONOS_MODULO[m]}
                  <span>{MODULOS[m].nombre}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Pie del Sidebar: usuario activo y cierre de sesión con Server Action */}
        <div className="p-4 border-t border-white/15 bg-[#7A1013]/50 space-y-3">
          {(nombre || email) && (
            <div className="px-2">
              {nombre && <p className="text-sm font-semibold text-white truncate">{nombre}</p>}
              {email && <p className="text-xs text-white/75 truncate">{email}</p>}
            </div>
          )}

          <Link
            href="/dashboard/cuenta"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            <span>Mi cuenta</span>
          </Link>

          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#A3161A] hover:bg-white/90 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión ({rol})</span>
            </button>
          </form>
        </div>
      </div>
    </SidebarShell>
  );
}
