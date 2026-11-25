export type Rol = 'ADMIN' | 'BECARIO' | 'DEPENDENCIA';

export const MODULOS = {
  crm: { nombre: 'CRM', ruta: '/dashboard/crm' },
  horario: { nombre: 'Horario y Disponibilidad', ruta: '/dashboard/horario' },
  asistencia: { nombre: 'Asistencia y QR', ruta: '/dashboard/asistencia' },
  conteoHoras: { nombre: 'Conteo de horas', ruta: '/dashboard/conteo-horas' },
  registroHoras: { nombre: 'Registro de horas', ruta: '/dashboard/registro-horas' },
  dependencias: { nombre: 'Dependencias activas', ruta: '/dashboard/dependencias' },
  staff: { nombre: 'Staff y eventos', ruta: '/dashboard/staff' },
  tareas: { nombre: 'Tareas pendientes', ruta: '/dashboard/tareas' },
} as const;

export type Modulo = keyof typeof MODULOS;

const TODOS = Object.keys(MODULOS) as Modulo[];

export const PERMISOS: Record<Rol, Modulo[]> = {
  ADMIN: TODOS,
  BECARIO: ['conteoHoras', 'asistencia', 'staff'],
  DEPENDENCIA: ['registroHoras'],
};

export function puede(rol: Rol | undefined, modulo: Modulo): boolean {
  return !!rol && PERMISOS[rol].includes(modulo);
}

export function moduloDeRuta(pathname: string): Modulo | null {
  const entrada = Object.entries(MODULOS).find(([, m]) =>
    pathname.startsWith(m.ruta),
  );
  return entrada ? (entrada[0] as Modulo) : null;
}
