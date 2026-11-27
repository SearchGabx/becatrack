'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CalendarClock, Database } from 'lucide-react';
import SearchFilters from './SearchFilters';
import AvailableStudentsTable from './AvailableStudentsTable';
import WeeklyTimetable, { type TimetableItem } from './WeeklyTimetable';
import { toMin } from '../constants';
import type { StudentWithSchedulesDTO } from '../actions';
import { CucLogo } from '@/components/ui/CucLogo';
import '../horario.css';

const StudentScheduleModal = dynamic(() => import('./StudentScheduleModal'));
const CsvUploadPanel = dynamic(() => import('./CsvUploadPanel'));
const PdfUploadPanel = dynamic(() => import('./PdfUploadPanel'));

interface HorarioWorkspaceProps {
  initPromociones: string[];
  initAllStudents: StudentWithSchedulesDTO[];
  initialSection?: 'disponibilidad' | 'gestion';
}

export default function HorarioWorkspace({
  initPromociones,
  initAllStudents = [],
  initialSection = 'disponibilidad',
}: HorarioWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<
    'disponibilidad' | 'gestion'
  >(initialSection);
  const [gestionTab, setGestionTab] = useState<'estudiantes' | 'horarios'>(
    'estudiantes',
  );

  const [modo, setModo] = useState<'disponibilidad' | 'antidisponibilidad'>(
    'disponibilidad',
  );
  const [selPromociones, setSelPromociones] = useState<string[]>([]);
  const [selEstudiantes, setSelEstudiantes] = useState<string[]>([]);

  const [selDias, setSelDias] = useState<string[]>([]);
  const [intervalosGlobal, setIntervalosGlobal] = useState({
    inicio: '',
    fin: '',
  });
  const [intervalosDia, setIntervalosDia] = useState<
    Record<string, { inicio: string; fin: string }[]>
  >({});

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [modalStudent, setModalStudent] =
    useState<StudentWithSchedulesDTO | null>(null);
  const [modalHorario, setModalHorario] = useState<TimetableItem[]>([]);

  const estudiantesDropdown = useMemo(() => {
    if (selPromociones.length === 0 || selPromociones.includes('TODAS')) {
      return initAllStudents;
    }
    return initAllStudents.filter(
      (s) => s.promo && selPromociones.includes(s.promo),
    );
  }, [initAllStudents, selPromociones]);

  useEffect(() => {
    setSelEstudiantes((prev) =>
      prev.filter((name) =>
        estudiantesDropdown.some((e) => e.nombre_completo === name),
      ),
    );
  }, [estudiantesDropdown]);

  const baseEstudiantes = useMemo(() => {
    return initAllStudents.filter((student) => {
      if (selPromociones.length > 0 && !selPromociones.includes('TODAS')) {
        if (!student.promo || !selPromociones.includes(student.promo)) {
          return false;
        }
      }
      if (selEstudiantes.length > 0 && !selEstudiantes.includes('TODOS')) {
        if (!selEstudiantes.includes(student.nombre_completo)) {
          return false;
        }
      }
      return true;
    });
  }, [initAllStudents, selPromociones, selEstudiantes]);

  const resultadoDisponibles = useMemo(() => {
    if (!selDias || selDias.length === 0) {
      return [];
    }

    const intervalosData: Record<string, { inicio: number; fin: number }[]> =
      {};
    for (const dia of selDias) {
      let bloques = intervalosDia[dia] || [];
      if (bloques.length === 0) bloques = [{ inicio: '', fin: '' }];

      intervalosData[dia] = bloques.map((b) => {
        const ini = b.inicio || intervalosGlobal.inicio;
        const fin = b.fin || intervalosGlobal.fin;
        return {
          inicio: toMin(ini) || 6 * 60,
          fin: toMin(fin) || 22 * 60,
        };
      });
    }

    const ocupadosSet = new Set<string>();

    for (const student of baseEstudiantes) {
      for (const sch of student.schedules || []) {
        const diaIntervalos = intervalosData[sch.dia];
        if (!diaIntervalos) continue;

        for (const inter of diaIntervalos) {
          if (
            sch.hora_fin_min > inter.inicio &&
            sch.hora_inicio_min < inter.fin
          ) {
            ocupadosSet.add(student.id);
            break;
          }
        }
        if (ocupadosSet.has(student.id)) break;
      }
    }

    if (modo === 'antidisponibilidad') {
      return baseEstudiantes.filter((s) => ocupadosSet.has(s.id));
    } else {
      return baseEstudiantes.filter((s) => !ocupadosSet.has(s.id));
    }
  }, [
    baseEstudiantes,
    selDias,
    intervalosDia,
    intervalosGlobal,
    modo,
  ]);

  const resultadoHorario = useMemo(() => {
    if (selEstudiantes.length === 0 || selEstudiantes.includes('TODOS')) {
      return [];
    }
    const selSet = new Set(selEstudiantes);
    const matched = initAllStudents.filter((s) =>
      selSet.has(s.nombre_completo),
    );
    return matched.flatMap((student) =>
      (student.schedules || []).map((sch) => ({
        ...sch,
        student,
      })),
    );
  }, [initAllStudents, selEstudiantes]);

  const openModal = (est: StudentWithSchedulesDTO) => {
    setModalStudent(est);
    const found = initAllStudents.find(
      (s) => s.id === est.id || s.nombre_completo === est.nombre_completo,
    );
    const hor = found ? found.schedules || [] : [];
    setModalHorario(hor);
  };

  return (
    <div className="horario-module">
      <div className="container">
        {/* Encabezado interno con marca CUC y selector de sección */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-[#CCCCCC]/70">
          <div className="flex items-center gap-4">
            <CucLogo variant="auburn" className="h-10" />
            <div>
              <h1 className="text-xl font-extrabold text-[#262626]">
                Horario y Disponibilidad de Becarios CUC
              </h1>
              <p className="text-xs text-[#595959]">
                Módulo integrado desde <code>horario-app</code> ·{' '}
                {initAllStudents.length} estudiante(s) registrados en base de
                datos
              </p>
            </div>
          </div>

          <nav className="top-menu" style={{ marginBottom: 0 }}>
            <button
              type="button"
              onClick={() => setActiveSection('disponibilidad')}
              className={`menu-link flex items-center gap-2 cursor-pointer ${
                activeSection === 'disponibilidad' ? 'active' : ''
              }`}
            >
              <CalendarClock className="h-4 w-4" />
              <span>Disponibilidad</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('gestion')}
              className={`menu-link flex items-center gap-2 cursor-pointer ${
                activeSection === 'gestion' ? 'active' : ''
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Gestión de Datos (CSV / PDFs)</span>
            </button>
          </nav>
        </div>

        {activeSection === 'disponibilidad' ? (
          <>
            <h2>Buscar estudiantes disponibles</h2>

            <SearchFilters
              modo={modo}
              setModo={setModo}
              initPromociones={initPromociones}
              selPromociones={selPromociones}
              setSelPromociones={setSelPromociones}
              estudiantes={estudiantesDropdown}
              selEstudiantes={selEstudiantes}
              setSelEstudiantes={setSelEstudiantes}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              selDias={selDias}
              setSelDias={setSelDias}
              intervalosGlobal={intervalosGlobal}
              setIntervalosGlobal={setIntervalosGlobal}
              intervalosDia={intervalosDia}
              setIntervalosDia={setIntervalosDia}
            />

            <AvailableStudentsTable
              estudiantes={resultadoDisponibles}
              modo={modo}
              onStudentClick={openModal}
              hasSelectedDays={selDias.length > 0}
            />

            <WeeklyTimetable
              horarios={resultadoHorario}
              title={`Horario semanal — ${
                selEstudiantes.length > 0 && !selEstudiantes.includes('TODOS')
                  ? selEstudiantes.join(', ').substring(0, 60) +
                    (selEstudiantes.join(', ').length > 60 ? '...' : '')
                  : 'Todos'
              }`}
            />

            {modalStudent && (
              <StudentScheduleModal
                student={modalStudent}
                horario={modalHorario}
                onClose={() => setModalStudent(null)}
              />
            )}
          </>
        ) : (
          <>
            <h2>Módulo de Gestión de Horarios</h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <button
                type="button"
                style={{
                  padding: '10px 20px',
                  background:
                    gestionTab === 'estudiantes'
                      ? 'var(--cuc-auburn)'
                      : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => setGestionTab('estudiantes')}
              >
                1. Cargar Estudiantes (CSV)
              </button>
              <button
                type="button"
                style={{
                  padding: '10px 20px',
                  background:
                    gestionTab === 'horarios' ? 'var(--cuc-auburn)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                onClick={() => setGestionTab('horarios')}
              >
                2. Cargar Horarios (PDFs) y Exportar Excel
              </button>
            </div>

            {gestionTab === 'estudiantes' && <CsvUploadPanel />}
            {gestionTab === 'horarios' && <PdfUploadPanel />}
          </>
        )}
      </div>
    </div>
  );
}
