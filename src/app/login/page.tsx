'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { login } from './actions';
import { CucLogo } from '@/components/ui/CucLogo';

export default function LoginPage() {
  const [error, accion, cargando] = useActionState(login, undefined);
  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-[#F7F7F7]">
      {/* Panel izquierdo institucional CUC: Fondo Auburn (#A3161A) con imagotipo blanco */}
      <div className="lg:w-1/2 cuc-gradient text-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la portada
          </Link>
          <div>
            <CucLogo
              variant="white"
              className="h-12"
              showCobranding
              cobrandingSubtitle="BECATRACK · GESTIÓN DE BECARIOS"
            />
          </div>
          <h2 className="mt-10 text-3xl lg:text-4xl font-extrabold leading-tight">
            Plataforma de Seguimiento y Horas Sociales de Becarios CUC
          </h2>
        </div>

        <p className="mt-8 text-xs text-white/70">
          Manual Normativo de Uso de Imagen CUC · Tipografía Red Hat Display · Paleta Auburn #A3161A
        </p>
      </div>

      {/* Panel derecho: Formulario de Login sobre fondo blanco con Imagotipo Auburn (#A3161A) */}
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <form
          action={accion}
          className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-xl border border-[#CCCCCC]/60"
        >
          <div className="flex flex-col items-center text-center">
            <CucLogo variant="auburn" className="h-11 mb-4" />
            <h1 className="text-2xl font-extrabold text-[#262626]">Ingresar a BECATRACK</h1>
            <p className="mt-1 text-sm text-[#595959]">
              Becarios y dependencias ingresan con su correo registrado. Para administración,
              escribe admin.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-wider text-[#595959]"
            >
              Correo
            </label>
            <input
              name="email"
              id="email"
              type="text"
              autoComplete="username"

              placeholder="Correo"
              required
              className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wider text-[#595959]"
            >
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              id="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              required
              className="w-full rounded-lg border border-[#CCCCCC] p-2.5 text-sm focus:border-[#A3161A] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[#A3161A]/10 border border-[#A3161A] p-3 text-sm font-medium text-[#A3161A]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#A3161A] p-3 text-sm font-bold text-white shadow hover:bg-[#7A1013] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <span>{cargando ? 'Ingresando...' : 'Ingresar'}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
