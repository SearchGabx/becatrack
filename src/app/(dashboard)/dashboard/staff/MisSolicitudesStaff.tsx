import { Building2, Clock, Users, Mail, CheckCircle2 } from 'lucide-react';
import type { solicitudesAsignadasBecario } from '@/modules/solicitudes-staff/becario';

type Solicitudes = Awaited<ReturnType<typeof solicitudesAsignadasBecario>>;

export function MisSolicitudesStaff({ solicitudes }: { solicitudes: Solicitudes }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#262626]">
        Apoyos Staff asignados por el Administrador ({solicitudes.length})
      </h2>

      {solicitudes.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-[#CCCCCC]/70 text-sm text-[#595959]">
          Aún no tienes apoyos Staff asignados a dependencias.
        </div>
      ) : (
        solicitudes.map((s) => (
          <article
            key={s.id}
            className="rounded-xl bg-white p-5 shadow-sm border border-[#CCCCCC]/70 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-extrabold text-[#262626]">{s.nombreEvento}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#078930]/15 px-2.5 py-0.5 text-xs font-bold text-[#078930]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Asignado
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#A3161A] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>
                    Dependencia: {s.dependencia.nombre} · Encargado: {s.dependencia.responsable}
                  </span>
                </p>
                {s.dependencia.email && (
                  <p className="text-xs text-[#595959] flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{s.dependencia.email}</span>
                  </p>
                )}
              </div>
              <span className="text-xs text-[#595959]">
                Respondida el{' '}
                {s.respondidaEn.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
              </span>
            </div>

            <p className="text-sm text-[#595959]">{s.descripcion}</p>

            {s.observacionAdmin && (
              <p className="rounded-lg bg-[#F7F7F7] px-3 py-2 text-xs text-[#262626] border-l-4 border-l-[#A3161A]">
                <strong>Observación Admin:</strong> {s.observacionAdmin}
              </p>
            )}

            <div className="space-y-3">
              {s.jornadas.map((j) => (
                <div
                  key={j.id}
                  className={`rounded-xl border p-4 ${
                    j.estoyAsignado
                      ? 'border-[#078930]/40 bg-[#078930]/5'
                      : 'border-[#CCCCCC]/70 bg-[#F7F7F7]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-[#262626]">
                      <Clock className="h-3.5 w-3.5 text-[#A3161A]" />
                      Jornada {j.orden} · {j.fechaTexto} ({j.diaSemana}) · {j.horaInicio} a{' '}
                      {j.horaFin}
                    </p>
                    <div className="flex items-center gap-2">
                      {j.estoyAsignado ? (
                        <span className="rounded-full bg-[#078930] px-2.5 py-0.5 text-[11px] font-bold text-white">
                          Estás en esta jornada
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#595959]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#595959]">
                          No asignado en esta jornada
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#A3161A]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#A3161A]">
                        <Users className="h-3 w-3" />
                        {j.integrantes.length}/{j.cantidadRequerida}
                      </span>
                    </div>
                  </div>

                  {j.integrantes.length === 0 ? (
                    <p className="text-xs text-[#595959]">Sin becarios asignados.</p>
                  ) : (
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {j.integrantes.map((i) => (
                        <li
                          key={i.id}
                          className={`rounded-lg px-3 py-2 text-xs ${
                            i.esYo
                              ? 'bg-white border border-[#078930]/50'
                              : 'bg-white border border-[#CCCCCC]/60'
                          }`}
                        >
                          <p className="font-bold text-[#262626]">
                            {i.nombre}
                            {i.esYo && (
                              <span className="ml-1.5 rounded bg-[#078930]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#078930]">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#595959]">
                            {i.programa}
                            {i.correo ? ` · ${i.correo}` : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
