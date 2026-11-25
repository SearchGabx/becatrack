import Link from 'next/link';
import {
  Users,
  Clock,
  FilePlus2,
  Building2,
  CalendarCheck2,
  ListTodo,
  CalendarClock,
  QrCode,
  ArrowUpRight,
} from 'lucide-react';
import { auth } from '@/auth';
import { MODULOS, PERMISOS, type Modulo } from '@/lib/permissions';
import { CucLogo } from '@/components/ui/CucLogo';

const DESCRIPCIONES_MODULO: Record<Modulo, string> = {
  crm: 'Ficha académica del becario, buscador por documento y bitácora de seguimientos estilo Atomic CRM.',
  horario: 'Consulta de horario académico y bloques de disponibilidad (módulo existente pendiente de integración).',
  asistencia: 'Control de asistencia con código QR institucional (módulo existente pendiente de integración).',
  conteoHoras: 'Progreso acumulado de horas sociales aprobadas más horas de Staff en eventos.',
  registroHoras: 'Reporte de horas realizadas en dependencias por documento del becario y flujo de aprobación.',
  dependencias: 'Gestión de unidades académicas y administrativas habilitadas en la CUC.',
  staff: 'Convocatorias, control de cupos y asignación de becarios a eventos institucionales.',
  tareas: 'Tablero de compromisos con cálculo automático de semáforo por fecha límite.',
};

const ICONOS_TARJETA: Record<Modulo, React.ReactNode> = {
  crm: <Users className="h-6 w-6 text-[#A3161A]" />,
  horario: <CalendarClock className="h-6 w-6 text-[#595959]" />,
  asistencia: <QrCode className="h-6 w-6 text-[#595959]" />,
  conteoHoras: <Clock className="h-6 w-6 text-[#078930]" />,
  registroHoras: <FilePlus2 className="h-6 w-6 text-[#C9A227]" />,
  dependencias: <Building2 className="h-6 w-6 text-[#A3161A]" />,
  staff: <CalendarCheck2 className="h-6 w-6 text-[#078930]" />,
  tareas: <ListTodo className="h-6 w-6 text-[#A3161A]" />,
};

export default async function InicioPage() {
  const session = await auth();
  const usuario = session!.user; // el layout ya garantiza la sesión
  const modulosPermitidos = PERMISOS[usuario.rol];

  return (
    <section className="space-y-6">
      {/* Banner superior institucional con Imagotipo Auburn sobre fondo blanco (Manual CUC pág. 3) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-[#A3161A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#A3161A]">
            Panel Institucional · Rol {usuario.rol}
          </span>
          <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-[#262626]">
            Hola, {usuario.name}
          </h1>
          <p className="text-sm text-[#595959]">
            Bienvenido a BECATRACK · Sistema de Gestión de Becarios de la Universidad de la Costa
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-[#CCCCCC]/50">
          <CucLogo variant="auburn" className="h-10" />
        </div>
      </div>

      {/* Grilla de módulos habilitados según PERMISOS[usuario.rol] */}
      <div>
        <h2 className="text-lg font-bold text-[#262626] mb-3">
          Módulos habilitados para tu perfil ({modulosPermitidos.length})
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {modulosPermitidos.map((m) => (
            <Link
              key={m}
              href={MODULOS[m].ruta}
              className="group rounded-xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 hover:border-[#A3161A] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-[#F7F7F7] border border-[#CCCCCC]/50">
                    {ICONOS_TARJETA[m]}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#A5A5A5] group-hover:text-[#A3161A] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#262626] group-hover:text-[#A3161A] transition-colors">
                  {MODULOS[m].nombre}
                </h3>
                <p className="mt-1.5 text-xs text-[#595959] leading-relaxed">
                  {DESCRIPCIONES_MODULO[m]}
                </p>
              </div>
              <span className="mt-4 inline-block text-xs font-bold text-[#A3161A]">
                Abrir módulo →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
