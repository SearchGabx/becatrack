'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

/**
 * En pantallas grandes el menú queda fijo a la izquierda.
 * En el celular se oculta y se abre como cajón con el botón de menú.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAbierto(false); // cerrar al navegar
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  return (
    <>
      <header className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-[#A3161A] px-4 text-white shadow">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          className="rounded-lg p-2 hover:bg-[#7A1013] cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="text-sm font-extrabold tracking-widest">
          BECATRACK
        </Link>
        <span className="w-9" />
      </header>

      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar menú"
          className="lg:hidden absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white hover:bg-[#7A1013] cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </aside>
    </>
  );
}

/** Enlace del menú que se resalta cuando corresponde a la página actual. */
export function NavLink({
  href,
  exacto = false,
  children,
}: {
  href: string;
  exacto?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activo = exacto ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        activo ? 'bg-white text-[#A3161A] shadow-sm' : 'text-white/95 hover:bg-[#7A1013]'
      }`}
    >
      {children}
    </Link>
  );
}
