'use client';
import { useActionState, useState, useTransition } from 'react';
import { UserPlus, X } from 'lucide-react';
import {
  guardarDependencia,
  cambiarClave,
  eliminarPerfil,
  asignarBecarioDependencia,
  quitarBecarioDependencia,
} from '@/modules/dependencias/actions';

type Perfil = { id: string; nombre: string; responsable: string; email: string | null };
export type BecarioResumen = {
  id: string;
  documento: string;
  nombre: string;
  programa: string;
};
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

export function GestorBecariosDependencia({
  dependenciaId,
  asignados,
  todosBecarios,
}: {
  dependenciaId: string;
  asignados: BecarioResumen[];
  todosBecarios: BecarioResumen[];
}) {
  const [seleccionado, setSeleccionado] = useState('');
  const [filtro, setFiltro] = useState('');
  const [pendiente, startTransition] = useTransition();

  const idsAsignados = new Set(asignados.map((b) => b.id));
  const disponibles = todosBecarios.filter((b) => {
    if (idsAsignados.has(b.id)) return false;
    if (!filtro.trim()) return true;
    const q = filtro.trim().toLowerCase();
    return (
      b.nombre.toLowerCase().includes(q) ||
      b.documento.toLowerCase().includes(q) ||
      b.programa.toLowerCase().includes(q)
    );
  });

  function agregar() {
    if (!seleccionado) return;
    const id = seleccionado;
    setSeleccionado('');
    startTransition(async () => {
      await asignarBecarioDependencia(dependenciaId, id);
    });
  }

  function quitar(becarioId: string) {
    startTransition(async () => {
      await quitarBecarioDependencia(dependenciaId, becarioId);
    });
  }

  return (
    <div className="grid gap-2.5 rounded-xl bg-white p-4 text-left border-t border-[#CCCCCC]/60">
      <h3 className="font-bold text-sm text-[#262626] flex items-center gap-1.5">
        <UserPlus className="h-4 w-4 text-[#A3161A]" />
        <span>Becarios asignados a servicio social ({asignados.length})</span>
      </h3>

      {asignados.length === 0 ? (
        <p className="text-xs text-[#595959]">
          Aún no hay becarios asignados a esta dependencia.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {asignados.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#F7F7F7] px-2.5 py-1.5 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-[#262626] truncate">{b.nombre}</p>
                <p className="text-[11px] text-[#595959]">
                  Doc: {b.documento} · {b.programa || 'Becario CUC'}
                </p>
              </div>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => quitar(b.id)}
                title="Quitar becario de esta dependencia"
                className="shrink-0 inline-flex items-center gap-1 rounded bg-[#A3161A]/10 px-2 py-1 text-[11px] font-bold text-[#A3161A] hover:bg-[#A3161A] hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 pt-1">
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar becario por nombre o documento..."
          className={input}
        />
        <div className="flex gap-2">
          <select
            aria-label="Seleccionar becario para asignar"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-[#ccc] bg-white p-2 text-xs"
          >
            <option value="">
              Seleccionar becario ({disponibles.length} disponible(s))...
            </option>
            {disponibles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre} — Doc: {b.documento}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!seleccionado || pendiente}
            onClick={agregar}
            className="shrink-0 rounded-lg bg-[#A3161A] px-3 py-2 text-xs font-bold text-white hover:bg-[#7A1013] disabled:opacity-50 cursor-pointer"
          >
            {pendiente ? '...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdministrarDependencia({
  perfil,
  tieneUsuario,
  becariosAsignados = [],
  todosBecarios = [],
}: {
  perfil: Perfil;
  tieneUsuario: boolean;
  becariosAsignados?: BecarioResumen[];
  todosBecarios?: BecarioResumen[];
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <details
      className="mb-2"
      onToggle={(e) => setAbierto(e.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold text-[#A3161A] hover:underline">
        Administrar / Asignar becarios
      </summary>
      {abierto && (
        <div className="mt-2 rounded-xl border border-[#CCCCCC]/70 bg-white shadow-sm divide-y divide-[#CCCCCC]/50 min-w-[300px]">
          <GestorBecariosDependencia
            dependenciaId={perfil.id}
            asignados={becariosAsignados}
            todosBecarios={todosBecarios}
          />
          <FormDependencia perfil={perfil} />
          {tieneUsuario && <FormClave id={perfil.id} />}
          <div className="p-3 text-left">
            <EliminarPerfil perfil={perfil} />
          </div>
        </div>
      )}
    </details>
  );
}
