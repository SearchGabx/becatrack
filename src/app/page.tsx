import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Users,
  CalendarCheck2,
  ListTodo,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { CucLogo } from '@/components/ui/CucLogo';

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col justify-between cuc-gradient text-white">
      {/* Encabezado Institucional con Cobranding CUC (Manual de Marca pág. 13) */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/15">
        <CucLogo
          variant="white"
          className="h-11"
          showCobranding
          cobrandingSubtitle="PROGRAMA DE BECAS · SAAS"
        />
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#A3161A] shadow hover:bg-[#FCD116] hover:text-[#262626] transition-colors"
        >
          <span>Iniciar sesión</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Hero Principal BECATRACK (Paso 5.9) */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FCD116] border border-white/20">
          <ShieldCheck className="h-4 w-4" />
          Universidad de la Costa · CUC
        </span>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          BECATRACK
        </h1>

        <p className="max-w-2xl text-center text-lg md:text-xl text-white/90 leading-relaxed">
          Gestión de becarios: CRM de seguimiento, horas sociales, dependencias,
          staff de eventos y tareas en semáforo en un solo lugar.
        </p>

        <div className="mt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-[#A3161A] shadow-lg hover:bg-[#FCD116] hover:text-[#262626] transition-all"
          >
            <span>Iniciar sesión</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tarjetas informativas de módulos */}
        <div className="mt-12 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/15">
            <Users className="h-6 w-6 text-[#FCD116] mb-2" />
            <h2 className="text-base font-bold">CRM de Becarios (Admin)</h2>
            <p className="mt-1 text-xs text-white/80">
              Ficha académica estilo Atomic CRM, buscador por documento/nombre e historial de seguimientos.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/15">
            <Clock className="h-6 w-6 text-[#FCD116] mb-2" />
            <h2 className="text-base font-bold">Conteo y Registro de Horas</h2>
            <p className="mt-1 text-xs text-white/80">
              Las dependencias registran horas por documento; el Admin las aprueba y el Becario consulta su progreso.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/15">
            <CalendarCheck2 className="h-6 w-6 text-[#FCD116] mb-2" />
            <h2 className="text-base font-bold">Staff, Dependencias y Semáforo</h2>
            <p className="mt-1 text-xs text-white/80">
              Control de cupos en eventos institucionales CUC, dependencias activas y tareas con semáforo automático.
            </p>
          </div>
        </div>
      </section>

      {/* Pie institucional */}
      <footer className="w-full border-t border-white/15 py-5 px-6 text-center text-xs text-white/75">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>© 2026 Universidad de la Costa (CUC) · BECATRACK SaaS (Next.js 15 + PostgreSQL 16)</span>
          <span className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> AWS Academy (EC2 + RDS + Docker + Caddy)
            </span>
            <span className="inline-flex items-center gap-1">
              <ListTodo className="h-3.5 w-3.5" /> Roles: Admin · Becario · Dependencia
            </span>
          </span>
        </div>
      </footer>
    </main>
  );
}
