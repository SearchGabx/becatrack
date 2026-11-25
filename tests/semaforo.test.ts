import { describe, expect, it } from 'vitest';
import { colorSemaforo } from '@/modules/tareas/semaforo';

const hoy = new Date('2026-11-25T12:00:00Z');

describe('semáforo de tareas', () => {
  it('rojo si ya venció', () => {
    expect(colorSemaforo(new Date('2026-11-20'), 'PENDIENTE', hoy)).toBe('rojo');
  });
  it('amarillo si vence en 3 días o menos', () => {
    expect(colorSemaforo(new Date('2026-11-27T12:00:00Z'), 'EN_PROGRESO', hoy)).toBe(
      'amarillo',
    );
  });
  it('verde si falta tiempo o está completada', () => {
    expect(colorSemaforo(new Date('2026-12-20'), 'PENDIENTE', hoy)).toBe('verde');
    expect(colorSemaforo(new Date('2026-11-01'), 'COMPLETADA', hoy)).toBe('verde');
  });
});
