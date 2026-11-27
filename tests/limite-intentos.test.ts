import { describe, expect, it } from 'vitest';
import {
  BLOQUEO_MS,
  MAX_ENTRADAS,
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

  it('purga entradas vencidas al alcanzar el límite de memoria', () => {
    const t = 2_000_000;
    for (let i = 0; i < MAX_FALLOS; i++) registrarFallo('vencido-0', t);
    for (let i = 1; i < MAX_ENTRADAS; i++) {
      registrarFallo(`usuario-${i}`, t + 100);
    }
    registrarFallo('nuevo-usuario', t + BLOQUEO_MS + 500);
    expect(bloqueado('vencido-0', t + BLOQUEO_MS + 500)).toBe(false);
  });
});
