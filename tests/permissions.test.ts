import { describe, expect, it } from 'vitest';
import { moduloDeRuta, puede } from '@/lib/permissions';

describe('permisos por rol', () => {
  it('el admin entra a todo', () => {
    expect(puede('ADMIN', 'crm')).toBe(true);
    expect(puede('ADMIN', 'tareas')).toBe(true);
  });
  it('el becario solo ve conteo, asistencia y staff', () => {
    expect(puede('BECARIO', 'conteoHoras')).toBe(true);
    expect(puede('BECARIO', 'staff')).toBe(true);
    expect(puede('BECARIO', 'crm')).toBe(false);
  });
  it('la dependencia solo registra horas', () => {
    expect(puede('DEPENDENCIA', 'registroHoras')).toBe(true);
    expect(puede('DEPENDENCIA', 'conteoHoras')).toBe(false);
  });
  it('traduce la URL al módulo', () => {
    expect(moduloDeRuta('/dashboard/crm/abc')).toBe('crm');
    expect(moduloDeRuta('/dashboard')).toBeNull();
  });
});
