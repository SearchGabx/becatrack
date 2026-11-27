import { CalendarCheck2, Clock, Users, Building2 } from 'lucide-react';
import { requireModule } from '@/lib/guards';
import { obtenerDatosSolicitudesStaff } from '@/modules/solicitudes-staff/queries';
import { FormSolicitudStaff } from './FormSolicitudStaff';
import { PanelAprobacionStaff } from './PanelAprobacionStaff';

export const dynamic = 'force-dynamic';

const ESTILO_ESTADO = {
  PENDIENTE: 'bg-[#FCD116]/30 text-[#262626] border border-[#C9A227]/50',
  APROBADA: 'bg-[#078930]/15 text-[#078930]',
  RECHAZADA: 'bg-[#A3161A]/15 text-[#A3161A]',
} as const;

export default async function SolicitudesStaffPage() {
  const usuario = await requireModule('solicitudesStaff');
  const esAdmin = usuario.rol === 'ADMIN';

  const { solicitudes, catalogoBecarios, dependencias } =
    await obtenerDatosSolicitudesStaff(usuario.rol, usuario.id);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#262626] flex items-center gap-2.5">
          <CalendarCheck2 className="h-7 w-7 text-[#A3161A]" />
          <span>
            {esAdmin
              ? 'Solicitudes de Apoyo Staff (Dependencias)'
              : 'Solicitar Apoyo Staff'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-[#595959]">
          {esAdmin
            ? 'Copia los becarios seleccionados desde Horario y Disponibilidad y pégalos en el apartado de cada jornada para aprobar y enviar el listado.'
            : 'Solicita becarios de apoyo para una o varias jornadas. Cuando el administrador la apruebe, verás aquí el listado asignado para cada rango horario.'}
        </p>
      </div>

      <FormSolicitudStaff dependencias={dependencias} />

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#262626]">
          {esAdmin ? 'Bandeja de solicitudes' : 'Mis solicitudes enviadas'} ({solicitudes.length})
        </h2>

        {solicitudes.length === 0 ? (
          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 text-sm text-[#595959]">
            Aún no hay solicitudes de apoyo Staff registradas.
          </div>
        ) : (
          solicitudes.map((sol) => (
            <article
              key={sol.id}
              className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#262626]">
                      {sol.nombreEvento}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ESTILO_ESTADO[sol.estado]
                      }`}
                    >
                      {sol.estado}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#A3161A] flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>
                      Dependencia: {sol.dependencia.nombre} ({sol.dependencia.responsable})
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {sol.jornadas.map((j) => (
                    <span
                      key={j.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7F7F7] border border-[#CCCCCC]/60 px-2.5 py-1 font-semibold text-[#262626]"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#A3161A]" />
                      <span>
                        J{j.orden}: {j.fechaTexto} ({j.diaSemana}) · {j.horaInicio} a{' '}
                        {j.horaFin}
                      </span>
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-[#A3161A]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#A3161A]">
                        <Users className="h-3 w-3" />
                        {j.cantidadRequerida}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-2.5 text-sm text-[#595959]">{sol.descripcion}</p>

              {sol.observacionAdmin && (
                <p className="mt-2 rounded-lg bg-[#F7F7F7] px-3 py-2 text-xs text-[#262626] border-l-4 border-l-[#A3161A]">
                  <strong>Observación Admin:</strong> {sol.observacionAdmin}
                </p>
              )}

              {/* Listados aprobados separados por jornada */}
              {sol.jornadas.some((j) => j.asignados.length > 0) && (
                <div className="mt-4 space-y-3">
                  {sol.jornadas.map((j) =>
                    j.asignados.length === 0 ? null : (
                      <div
                        key={j.id}
                        className="rounded-xl border border-[#078930]/30 bg-[#078930]/5 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#078930]">
                            Jornada {j.orden} · {j.fechaTexto} ({j.diaSemana}) ·{' '}
                            {j.horaInicio} a {j.horaFin}
                          </p>
                          <span className="rounded-full bg-[#078930]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#078930]">
                            {j.asignados.length} becario(s) asignado(s)
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#078930]/20 text-[#262626] font-bold">
                              <tr>
                                <th className="py-1.5 pr-3">Prom</th>
                                <th className="py-1.5 pr-3">Becario</th>
                                <th className="py-1.5 pr-3">Documento</th>
                                <th className="py-1.5 pr-3">Programa</th>
                                <th className="py-1.5 pr-3">Contacto</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#078930]/15">
                              {j.asignados.map((b) => (
                                <tr key={b.id}>
                                  <td className="py-1.5 pr-3 font-semibold text-[#595959]">
                                    {b.promocion ?? '—'}
                                  </td>
                                  <td className="py-1.5 pr-3 font-bold text-[#262626]">
                                    {b.nombre}
                                  </td>
                                  <td className="py-1.5 pr-3 font-mono">{b.documento}</td>
                                  <td className="py-1.5 pr-3 text-[#595959]">
                                    {b.programa}
                                  </td>
                                  <td className="py-1.5 pr-3 text-[#595959]">
                                    {[b.correo, b.contacto].filter(Boolean).join(' · ') ||
                                      '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {esAdmin && (
                <PanelAprobacionStaff
                  solicitudId={sol.id}
                  jornadas={sol.jornadas}
                  catalogoBecarios={catalogoBecarios}
                  estadoActual={sol.estado}
                  observacionActual={sol.observacionAdmin}
                />
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
