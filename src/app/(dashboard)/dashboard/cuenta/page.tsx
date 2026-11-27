import { KeyRound } from 'lucide-react';
import { FormClave } from './FormClave';

export default function CuentaPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <KeyRound className="h-7 w-7 text-[#A3161A]" />
          <span>Mi cuenta</span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">Cambia tu contraseña de acceso.</p>
      </div>
      <FormClave />
    </section>
  );
}
