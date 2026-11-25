import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { cambiarClave } from '@/modules/dependencias/actions';

const { requireModule, updateMany } = vi.hoisted(() => ({
  requireModule: vi.fn(), updateMany: vi.fn(),
}));
vi.mock('@/lib/guards', () => ({ requireModule }));
vi.mock('@/lib/db', () => ({ db: { usuario: { updateMany } } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Contraseñas de dependencias', () => {
  it.each([null, 'perfil-elegido'])('limita el cambio al conjunto solicitado (%s)', async id => {
    updateMany.mockResolvedValue({ count: 1 });
    const form = new FormData();
    form.set('password', 'clave de prueba');
    await cambiarClave(id, undefined, form);
    expect(requireModule).toHaveBeenCalledWith('dependencias');
    const [{ where, data }] = updateMany.mock.lastCall!;
    expect(where).toEqual({ rol: 'DEPENDENCIA', dependencia: { is: id ? { id } : {} } });
    expect(await bcrypt.compare('clave de prueba', data.passwordHash)).toBe(true);
  });
  it('impide cambiar claves sin permiso', async () => {
    updateMany.mockClear();
    requireModule.mockRejectedValueOnce(new Error('Acceso denegado'));
    await expect(cambiarClave(null, undefined, new FormData())).rejects.toThrow('Acceso denegado');
    expect(updateMany).not.toHaveBeenCalled();
  });
});
