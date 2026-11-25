'use server';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export async function login(_prev: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return 'Correo o contraseña incorrectos';
    }
    throw error; // la redirección exitosa también viaja como excepción
  }
}
