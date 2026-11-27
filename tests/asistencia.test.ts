import { describe, expect, it } from 'vitest';
import { firmarToken, verificarToken, VIGENCIA_TOKEN_MS } from '@/modules/asistencia/token';
import { contarAsistencia, estadoAsistencia, horasEntre } from '@/modules/asistencia/resumen';

const CLAVE = 'clave-de-prueba';

describe('token del QR', () => {
  const ahora = 1_700_000_000_000;

  it('acepta un token recién firmado', () => {
    const token = firmarToken('becario1', ahora, CLAVE);
    expect(verificarToken(token, ahora + 1000, CLAVE)).toEqual({ ok: true, becarioId: 'becario1' });
  });

  it('rechaza un token vencido', () => {
    const token = firmarToken('becario1', ahora, CLAVE);
    expect(verificarToken(token, ahora + VIGENCIA_TOKEN_MS + 1, CLAVE)).toEqual({
      ok: false,
      motivo: 'vencido',
    });
  });

  it('rechaza un token alterado o firmado con otra clave', () => {
    const token = firmarToken('becario1', ahora, CLAVE);
    const alterado = token.replace('becario1', 'becario2');
    expect(verificarToken(alterado, ahora, CLAVE)).toMatchObject({ ok: false, motivo: 'firma' });
    expect(verificarToken(token, ahora, 'otra-clave')).toMatchObject({ ok: false, motivo: 'firma' });
  });

  it('rechaza un QR con solo el documento', () => {
    expect(verificarToken('1001234567', ahora, CLAVE)).toMatchObject({ ok: false, motivo: 'formato' });
  });
});

describe('resumen de asistencia', () => {
  it('clasifica completa, parcial y ausente', () => {
    expect(estadoAsistencia(['INICIO', 'FIN'])).toBe('COMPLETA');
    expect(estadoAsistencia(['INICIO'])).toBe('PARCIAL');
    expect(estadoAsistencia([])).toBe('AUSENTE');
  });

  it('cuenta los estados', () => {
    expect(contarAsistencia(['COMPLETA', 'PARCIAL', 'AUSENTE', 'AUSENTE'])).toEqual({
      total: 4,
      COMPLETA: 1,
      PARCIAL: 1,
      AUSENTE: 2,
    });
  });

  it('calcula horas redondeadas a media hora', () => {
    const inicio = new Date('2026-11-25T14:00:00Z');
    expect(horasEntre(inicio, new Date('2026-11-25T15:40:00Z'))).toBe(1.5);
    expect(horasEntre(inicio, undefined)).toBeNull();
    expect(horasEntre(inicio, new Date('2026-11-25T13:00:00Z'))).toBeNull();
  });
});
