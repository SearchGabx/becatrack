'use client';
import { useActionState } from 'react';
import { guardarDependencia, cambiarClave, eliminarPerfil } from '@/modules/dependencias/actions';

type Perfil = { id: string; nombre: string; responsable: string; email: string | null };
const input = 'rounded-lg border border-[#ccc] p-2 text-sm';
const button = 'rounded-lg bg-[#A3161A] px-3 py-2 text-sm font-bold text-white disabled:opacity-50';

export function FormDependencia({ perfil }: { perfil?: Perfil }) {
  const [mensaje, accion, cargando] = useActionState(
    guardarDependencia.bind(null, perfil?.id ?? null),
    undefined,
  );
  return (
    <form action={accion} className="grid gap-3 rounded-xl bg-white p-4 text-left">
      <h2 className="font-bold">{perfil ? 'Editar perfil' : 'Añadir dependencia'}</h2>
      <input
        name="nombre"
        aria-label="Nombre"
        placeholder="Nombre de la dependencia"
        defaultValue={perfil?.nombre}
        required
        className={input}
      />
      <input
        name="responsable"
        aria-label="Responsable"
        placeholder="Responsable"
        defaultValue={perfil?.responsable}
        required
        className={input}
      />
      <input
        name="email"
        type="email"
        aria-label="Correo de acceso"
        placeholder="Correo de acceso"
        defaultValue={perfil?.email ?? ''}
        required
        className={input}
      />
      <button disabled={cargando} className={button}>
        {perfil ? 'Guardar cambios' : 'Crear dependencia'}
      </button>
      <p role="status">{mensaje}</p>
    </form>
  );
}

export function FormClave({ id = null }: { id?: string | null }) {
  const [mensaje, accion, cargando] = useActionState(cambiarClave.bind(null, id), undefined);
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (id === null && !window.confirm('¿Cambiar la contraseña de todas las dependencias?'))
          e.preventDefault();
      }}
      className="grid gap-2 rounded-xl bg-white p-4 text-left"
    >
      <label className="grid gap-2 font-semibold">
        {id ? 'Nueva contraseña' : 'Nueva contraseña para todas las dependencias'}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
      </label>
      <button disabled={cargando} className={button}>
        Cambiar contraseña
      </button>
      <p role="status">{mensaje}</p>
    </form>
  );
}

export function EliminarPerfil({ perfil }: { perfil: Perfil }) {
  return (
    <form
      action={eliminarPerfil.bind(null, perfil.id)}
      onSubmit={(e) => {
        if (
          !window.confirm(
            '¿Eliminar el perfil de ' + perfil.nombre + '? Se conservarán sus registros de horas.',
          )
        )
          e.preventDefault();
      }}
    >
      <button className="px-3 py-1 text-red-800">Eliminar perfil</button>
    </form>
  );
}
