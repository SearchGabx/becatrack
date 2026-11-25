import type { NextAuthConfig } from 'next-auth';
import { moduloDeRuta, puede, type Rol } from '@/lib/permissions';

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 horas
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      if (!nextUrl.pathname.startsWith('/dashboard')) return true;
      if (!auth?.user) return false; // sin sesión → /login
      const modulo = moduloDeRuta(nextUrl.pathname);
      if (modulo && !puede(auth.user.rol, modulo)) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rol = user.rol;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as Rol;
      return session;
    },
  },
} satisfies NextAuthConfig;
