import { describe, expect, it } from 'vitest';
import {
  BLOQUEO_MS,
  MAX_FALLOS,
  bloqueado,
  limpiarFallos,
  registrarFallo,
} from '@/lib/limite-intentos';

describe('límite de intentos de inicio de sesión', () => {
  it('bloquea tras varios fallos y libera al vencer el tiempo', () => {
    const t = 1_000_000;
    for (let i = 0; i < MAX_FALLOS; i++) registrarFallo('ana', t);
    expect(bloqueado('ana', t + 1000)).toBe(true);
    expect(bloqueado('ana', t + BLOQUEO_MS + 1)).toBe(false);
  });

  it('un ingreso correcto limpia los fallos', () => {
    registrarFallo('luis');
    registrarFallo('luis');
    limpiarFallos('luis');
    expect(bloqueado('luis')).toBe(false);
  });
});
