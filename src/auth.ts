import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verificarAcceso } from '@/lib/acceso';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        return verificarAcceso(db, String(credentials.email ?? ''), String(credentials.password ?? ''));
      },
    }),
  ],
});
