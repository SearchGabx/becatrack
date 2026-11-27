'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Vuelve a pedir los datos del servidor cada pocos segundos cuando la pestaña está visible. */
export function AutoRefresco({ cadaMs = 5000 }: { cadaMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const refrescarSiVisible = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };
    const id = setInterval(refrescarSiVisible, cadaMs);
    document.addEventListener('visibilitychange', refrescarSiVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refrescarSiVisible);
    };
  }, [router, cadaMs]);
  return null;
}
