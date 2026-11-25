import type { DefaultSession } from 'next-auth';
import type { Rol } from '@/lib/permissions';

declare module 'next-auth' {
  interface User {
    rol: Rol;
  }
  interface Session {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession['user'];
  }
}
