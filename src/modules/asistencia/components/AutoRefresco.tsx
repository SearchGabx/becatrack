'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Vuelve a pedir los datos del servidor cada pocos segundos (conteo en vivo). */
export function AutoRefresco({ cadaMs = 5000 }: { cadaMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), cadaMs);
    return () => clearInterval(id);
  }, [router, cadaMs]);
  return null;
}
