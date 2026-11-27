'use server';

import { parse } from 'csv-parse/sync';
import pdf from 'pdf-parse';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireModule } from '@/lib/guards';

export interface ScheduleDTO {
  id: number;
  studentId: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  hora_inicio_min: number;
  hora_fin_min: number;
  materia: string;
  docente: string | null;
  codigo_clase: string | null;
  promocion: string | null;
  periodo: string | null;
  prog: string | null;
}

export interface StudentWithSchedulesDTO {
  id: string;
  nombre_completo: string;
  nombre_norm: string;
  promo: string | null;
  correo: string | null;
  contacto: string | null;
  schedules: ScheduleDTO[];
}

export interface StudentCsvPreviewRow {
  id: string;
  nombre_completo: string;
  promo: string | null;
  correo: string | null;
  contacto: string | null;
  municipio: string | null;
  programa: string | null;
  estado: 'Actualizar' | 'Nuevo';
  errores: string[];
}

export interface PdfScheduleRow {
  Promocion: string;
  Periodo: string;
  ID_Estudiante: string;
  Codigo_Clase: string;
  Materia: string;
  Docente: string;
  Prog: string;
  Dia: string;
  Hora_Inicio: string;
  Hora_Fin: string;
}

export interface PdfPreviewStudent {
  id: string;
  nombre: string;
  estado: 'Reemplazar' | 'Nuevo';
  materiasCount: number;
}

function normalizar(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export async function getAllStudentsWithSchedules(): Promise<StudentWithSchedulesDTO[]> {
  await requireModule('horario');
  return db.student.findMany({
    orderBy: { nombre_norm: 'asc' },
    select: {
      id: true,
      nombre_completo: true,
      nombre_norm: true,
      promo: true,
      correo: true,
      contacto: true,
      schedules: {
        select: {
          id: true,
          studentId: true,
          dia: true,
          hora_inicio: true,
          hora_fin: true,
          hora_inicio_min: true,
          hora_fin_min: true,
          materia: true,
          docente: true,
          codigo_clase: true,
          promocion: true,
          periodo: true,
          prog: true,
        },
      },
    },
  });
}

export async function getPromociones(): Promise<string[]> {
  await requireModule('horario');
  const proms = await db.student.findMany({
    select: { promo: true },
    where: { promo: { not: '' } },
    distinct: ['promo'],
  });
  return proms
    .map((p) => p.promo)
    .filter((p): p is string => p !== null)
    .sort()
    .reverse();
}

export async function previewStudentsCsv(
  formData: FormData,
): Promise<StudentCsvPreviewRow[]> {
  await requireModule('horario');
  const allowUpdate = formData.get('allowUpdate') === 'true';
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No se proporcionó archivo');

  const text = await file.text();
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  const currentStudents = await db.student.findMany({
    select: { id: true, correo: true, contacto: true },
  });
  const currentIds = new Set(currentStudents.map((s) => s.id));

  const emailMap = new Map<string, string>();
  const phoneMap = new Map<string, string>();
  for (const s of currentStudents) {
    if (s.correo) emailMap.set(s.correo.toLowerCase(), s.id);
    if (s.contacto) phoneMap.set(s.contacto, s.id);
  }

  const csvEmails = new Set<string>();
  const csvPhones = new Set<string>();
  const csvDocs = new Set<string>();

  const results: StudentCsvPreviewRow[] = [];

  for (const record of records) {
    const errores: string[] = [];

    const idRaw = record['Documento']?.trim().replace(/\.0$/, '');
    if (!idRaw) errores.push('El documento no puede estar vacío');
    else if (!/^\d+$/.test(idRaw)) {
      errores.push('El documento debe contener solo números');
    }
    const id = idRaw || '';

    const pNombre = record['Primer Nombre']?.trim();
    const sNombre = record['Segundo Nombre']?.trim();
    const pApellido = record['Primer Apellido']?.trim();
    const sApellido = record['Segundo Apellido']?.trim();

    if (!pNombre) errores.push('El primer nombre es obligatorio');
    if (!pApellido) errores.push('El primer apellido es obligatorio');
    if (!sApellido) errores.push('El segundo apellido es obligatorio');

    const parts = [pNombre, sNombre, pApellido, sApellido].filter(Boolean);
    const nombre_completo = parts.join(' ');

    if (!nombre_completo) {
      errores.push('No se pudo formar el nombre del estudiante');
    }

    const promo = record['Promocion']?.trim();
    if (!promo) errores.push('La promoción es obligatoria');

    const correo = record['Correo']?.trim();
    if (!correo) errores.push('El correo es obligatorio');
    const contacto = record['Contacto']?.trim();
    if (!contacto) errores.push('El contacto es obligatorio');
    const municipio = record['Municipio']?.trim();
    if (!municipio) errores.push('El municipio es obligatorio');
    const programa = record['Programa']?.trim();
    if (!programa) errores.push('El programa es obligatorio');

    const exists = currentIds.has(id);
    if (exists && !allowUpdate) {
      errores.push(
        'El documento ya existe y no habilitaste la opción de actualizar',
      );
    }

    if (id) {
      if (csvDocs.has(id)) {
        errores.push('Documento duplicado en este mismo archivo CSV');
      } else {
        csvDocs.add(id);
      }
    }

    if (correo) {
      const lowerCorreo = correo.toLowerCase();
      if (csvEmails.has(lowerCorreo)) {
        errores.push('Correo duplicado en este mismo archivo CSV');
      } else {
        csvEmails.add(lowerCorreo);
      }

      if (emailMap.has(lowerCorreo) && emailMap.get(lowerCorreo) !== id) {
        errores.push('El correo ya está registrado por otro estudiante en la BD');
      }
    }

    if (contacto) {
      if (csvPhones.has(contacto)) {
        errores.push('Contacto duplicado en este mismo archivo CSV');
      } else {
        csvPhones.add(contacto);
      }

      if (phoneMap.has(contacto) && phoneMap.get(contacto) !== id) {
        errores.push(
          'El número de contacto ya está registrado por otro estudiante en la BD',
        );
      }
    }

    results.push({
      id,
      nombre_completo,
      promo: promo || null,
      correo: correo || null,
      contacto: contacto || null,
      municipio: municipio || null,
      programa: programa || null,
      estado: exists ? 'Actualizar' : 'Nuevo',
      errores,
    });
  }

  return results;
}

const EstudianteCsvSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Documento inválido'),
  nombre_completo: z.string().trim().min(3),
  promo: z.string().trim().min(1),
  correo: z.string().trim().min(3),
  contacto: z.string().trim().min(1),
  municipio: z.string().trim().min(1),
  programa: z.string().trim().min(1),
  estado: z.enum(['Actualizar', 'Nuevo']),
});

export async function applyStudentsCsv(
  entrada: Omit<StudentCsvPreviewRow, 'errores'>[],
) {
  await requireModule('horario');
  // Los datos vienen del navegador: se validan de nuevo antes de guardar.
  const validados = z.array(EstudianteCsvSchema).max(5000).safeParse(entrada);
  if (!validados.success) throw new Error('El archivo tiene filas inválidas. Vuelve a previsualizarlo.');
  const students = validados.data;
  let creados = 0;
  let actualizados = 0;

  const transactionOps = students.map((s) => {
    const data = {
      nombre_completo: s.nombre_completo,
      nombre_norm: normalizar(s.nombre_completo),
      promo: s.promo,
      correo: s.correo,
      contacto: s.contacto,
      municipio: s.municipio,
      programa: s.programa,
      actualizado_en: new Date().toISOString(),
    };
    if (s.estado === 'Nuevo') creados++;
    else actualizados++;

    return db.student.upsert({
      where: { id: s.id },
      update: data,
      create: { id: s.id, ...data },
    });
  });

  await db.$transaction(transactionOps);

  revalidatePath('/dashboard/horario');
  return { creados, actualizados };
}

function convertir24(horaStr: string | null | undefined): number {
  if (!horaStr) return 0;
  const s = horaStr.toString().trim().toLowerCase();
  const match12 = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const p = match12[3];
    if (p === 'pm' && h !== 12) h += 12;
    if (p === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = s.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }
  return 0;
}

function formatearHora(horaRaw: string | null | undefined): string {
  if (!horaRaw) return '';
  const min = convertir24(horaRaw.toString());
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const DIA_MAP: Record<string, string> = {
  LUN: 'LUNES',
  MAR: 'MARTES',
  MIE: 'MIERCOLES',
  JUE: 'JUEVES',
  VIE: 'VIERNES',
  SAB: 'SABADO',
  DOM: 'DOMINGO',
};

function normalizarDia(dia: string) {
  const key = normalizar(dia).toUpperCase().substring(0, 3);
  return DIA_MAP[key] || '';
}

function parseHeader(text: string) {
  const info = { Periodo: '', ID_Estudiante: '', Nombre_Estudiante: '' };
  let m = text.match(/Periodo\s*[:\-]?\s*(\d+)/i);
  if (m) info.Periodo = m[1];
  m = text.match(/Alumno\s*:\s*([^\n(]+)\(([^)]+)\)/i);
  if (m) {
    info.Nombre_Estudiante = m[1].trim();
    info.ID_Estudiante = m[2].trim();
    return info;
  }
  const textPlain = normalizar(text).toUpperCase();
  m = textPlain.match(
    /Estudiante\s*[:\-]?\s*(\d+)\s+([A-Z\s]+?)(?=\s+HORAS|\n|$)/,
  );
  if (m) {
    info.ID_Estudiante = m[1];
    info.Nombre_Estudiante = m[2].trim();
  }
  return info;
}

function parseTimeLine(line: string) {
  const day = '(?:Lun|Mar|Mi[eé]|Jue|Vie|S[aá]b|Dom)';
  const pattern = new RegExp(
    `^(${day}(?:\\s*,\\s*${day})*)\\s+(\\d{1,2}:\\d{2})\\s*-\\s*(\\d{1,2}:\\d{2})`,
    'i',
  );
  const match = line.match(pattern);
  if (!match) return [];
  const diasStr = match[1];
  const inicio = match[2];
  const fin = match[3];
  const dias = diasStr.split(/\s*,\s*/).map(normalizarDia).filter(Boolean);
  return dias.map((dia) => ({ Dia: dia, Hora_Inicio: inicio, Hora_Fin: fin }));
}

function parseNewFormat(text: string) {
  const rows: Omit<
    PdfScheduleRow,
    'Promocion' | 'Periodo' | 'ID_Estudiante'
  >[] = [];
  const lines = text
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
  let i = 0;
  while (i < lines.length) {
    const codeMatch = lines[i].match(/Materia\s*:\s*(.+)$/i);
    if (!codeMatch) {
      i++;
      continue;
    }
    const codigo = codeMatch[1].trim();
    const block: string[] = [];
    i++;
    while (i < lines.length && !lines[i].match(/Materia\s*:/i)) {
      block.push(lines[i]);
      i++;
    }
    if (block.length === 0) continue;
    const materiaLines: string[] = [];
    let docente = '';
    const horarios: { Dia: string; Hora_Inicio: string; Hora_Fin: string }[] =
      [];
    for (const line of block) {
      const parsedTimes = parseTimeLine(line);
      if (parsedTimes.length > 0) {
        horarios.push(...parsedTimes);
        continue;
      }
      if (line.includes('Grupo ')) {
        docente = line.split('Grupo ')[0].replace(/[|\s]+$/, '').trim();
        continue;
      }
      if (docente) continue;
      if (line.match(/Sin\s+horario|^\d{2}\.\d{2}\.\d{4}|^-$|B\s*\|/i)) {
        continue;
      }
      materiaLines.push(line);
    }
    const materia = materiaLines.join(' ').trim();
    if (!materia || normalizar(materia).toUpperCase().includes('BIVE')) {
      continue;
    }
    const base = {
      Codigo_Clase: codigo,
      Materia: materia,
      Docente: docente,
      Prog: '',
    };
    if (horarios.length > 0) {
      for (const hor of horarios) rows.push({ ...base, ...hor });
    }
  }
  return rows;
}

export async function previewSchedulesPdf(
  formData: FormData,
  promocion: string,
): Promise<{
  estudiantes: PdfPreviewStudent[];
  ignored: string[];
  schedulesToInsert: PdfScheduleRow[];
}> {
  await requireModule('horario');
  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) {
    throw new Error('No se proporcionaron archivos PDF');
  }

  const allStudents = await db.student.findMany({
    select: {
      id: true,
      nombre_norm: true,
      nombre_completo: true,
      correo: true,
    },
  });

  const studentsWithSchedule = new Set(
    (
      await db.schedule.findMany({
        select: { studentId: true },
        distinct: ['studentId'],
      })
    ).map((s) => s.studentId),
  );

  const allRows: PdfScheduleRow[] = [];
  const validStudents = new Map<string, PdfPreviewStudent>();
  const ignoredPdfs: string[] = [];

  const CONCURRENCIA_PDF = 4;
  const parsedFiles: {
    fileName: string;
    header: ReturnType<typeof parseHeader>;
    rows: ReturnType<typeof parseNewFormat>;
  }[] = [];

  for (let i = 0; i < files.length; i += CONCURRENCIA_PDF) {
    const lote = files.slice(i, i + CONCURRENCIA_PDF);
    const resultadosLote = await Promise.all(
      lote.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdf(buffer);
        const fullText = data.text;
        return {
          fileName: file.name,
          header: parseHeader(fullText),
          rows: parseNewFormat(fullText),
        };
      }),
    );
    parsedFiles.push(...resultadosLote);
  }

  for (const { fileName, header, rows } of parsedFiles) {
    const normNombre = normalizar(header.Nombre_Estudiante);
    const pdfWords = normNombre.split(' ').filter((w) => w.length > 2);

    const scoredMatches = allStudents
      .map((s) => {
        const dbWords = s.nombre_norm.split(' ');
        const matchCount = pdfWords.filter((w) => dbWords.includes(w)).length;
        return { student: s, matchCount };
      })
      .filter((x) => x.matchCount >= (pdfWords.length < 2 ? 1 : 2));

    let matchedStudent: (typeof allStudents)[number] | undefined;

    if (scoredMatches.length > 0) {
      scoredMatches.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        const aHasBase = a.student.correo ? 1 : 0;
        const bHasBase = b.student.correo ? 1 : 0;
        return bHasBase - aHasBase;
      });
      matchedStudent = scoredMatches[0].student;
    }

    if (!matchedStudent) {
      ignoredPdfs.push(
        `${fileName} (No coincide con nadie: ${header.Nombre_Estudiante || 'Desconocido'})`,
      );
      continue;
    }

    if (rows.length > 0) {
      const stdId = matchedStudent.id;

      if (!validStudents.has(stdId)) {
        validStudents.set(stdId, {
          id: stdId,
          nombre: matchedStudent.nombre_completo,
          estado: studentsWithSchedule.has(stdId) ? 'Reemplazar' : 'Nuevo',
          materiasCount: 0,
        });
      }

      const item = validStudents.get(stdId)!;
      item.materiasCount += rows.length;

      allRows.push(
        ...rows.map((r) => ({
          Promocion: promocion,
          Periodo: header.Periodo,
          ID_Estudiante: stdId,
          ...r,
        })),
      );
    } else {
      ignoredPdfs.push(
        `${fileName} (No se detectaron materias con el formato esperado)`,
      );
    }
  }

  return {
    estudiantes: Array.from(validStudents.values()),
    ignored: ignoredPdfs,
    schedulesToInsert: allRows,
  };
}

const FilaHorarioSchema = z.object({
  Promocion: z.string(),
  Periodo: z.string(),
  ID_Estudiante: z.string().min(1),
  Codigo_Clase: z.string(),
  Materia: z.string().min(1),
  Docente: z.string(),
  Prog: z.string(),
  Dia: z.enum(['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']),
  Hora_Inicio: z.string().regex(/^\d{1,2}:\d{2}/),
  Hora_Fin: z.string().regex(/^\d{1,2}:\d{2}/),
});

export async function applySchedulesPdf(entrada: PdfScheduleRow[]) {
  await requireModule('horario');
  if (!entrada || entrada.length === 0) return 0;
  const validados = z.array(FilaHorarioSchema).max(20000).safeParse(entrada);
  if (!validados.success) throw new Error('Los horarios tienen filas inválidas. Vuelve a previsualizar los PDF.');
  const schedulesData = validados.data;

  const schedulesToInsert: Prisma.ScheduleCreateManyInput[] = [];
  const affectedStudents = new Set<string>();

  for (const record of schedulesData) {
    const dia = record.Dia?.trim().toUpperCase();
    const horaInicioStr = record.Hora_Inicio;
    const horaFinStr = record.Hora_Fin;
    const materia = record.Materia;

    if (!dia || !horaInicioStr || !horaFinStr || !materia) continue;

    const horaInicioMin = convertir24(horaInicioStr);
    const horaFinMin = convertir24(horaFinStr);

    affectedStudents.add(record.ID_Estudiante);

    schedulesToInsert.push({
      studentId: record.ID_Estudiante,
      promocion: record.Promocion || null,
      periodo: record.Periodo || null,
      dia,
      hora_inicio: formatearHora(horaInicioStr),
      hora_fin: formatearHora(horaFinStr),
      hora_inicio_min: horaInicioMin,
      hora_fin_min: horaFinMin,
      prog: record.Prog || null,
      codigo_clase: record.Codigo_Clase || null,
      materia: String(materia).trim(),
      docente: record.Docente || null,
    });
  }

  // Borrar e insertar en una transacción: si algo falla, nadie queda sin horario.
  await db.$transaction(
    async (tx) => {
      await tx.schedule.deleteMany({
        where: { studentId: { in: Array.from(affectedStudents) } },
      });
      const chunkSize = 5000;
      for (let i = 0; i < schedulesToInsert.length; i += chunkSize) {
        await tx.schedule.createMany({ data: schedulesToInsert.slice(i, i + chunkSize) });
      }
    },
    { timeout: 60_000 },
  );

  revalidatePath('/dashboard/horario');
  return schedulesToInsert.length;
}

const ORDEN_DIAS: Record<string, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

export async function getSchedulesVerificationData() {
  await requireModule('horario');
  const students = await db.student.findMany({
    orderBy: [{ promo: 'desc' }, { nombre_norm: 'asc' }],
    include: {
      schedules: true,
    },
  });

  const detalleHorarios: Record<string, string | number>[] = [];
  const resumenEstudiantes: Record<string, string | number>[] = [];

  for (const st of students) {
    const sortedSchedules = [...st.schedules].sort((a, b) => {
      const dayDiff = (ORDEN_DIAS[a.dia] || 99) - (ORDEN_DIAS[b.dia] || 99);
      if (dayDiff !== 0) return dayDiff;
      return a.hora_inicio_min - b.hora_inicio_min;
    });

    const materiasUnicas = Array.from(
      new Set(sortedSchedules.map((s) => s.materia)),
    );

    resumenEstudiantes.push({
      Documento: st.id,
      'Nombre Completo': st.nombre_completo,
      Promoción: st.promo || '',
      Programa: st.programa || '',
      Correo: st.correo || '',
      Contacto: st.contacto || '',
      Municipio: st.municipio || '',
      'Estado Horario':
        sortedSchedules.length > 0 ? 'Con Horario' : 'SIN HORARIO',
      'Materias Distintas': materiasUnicas.length,
      'Total Franjas': sortedSchedules.length,
      'Lista de Materias': materiasUnicas.join(' | '),
    });

    for (const sch of sortedSchedules) {
      detalleHorarios.push({
        Documento: st.id,
        'Nombre Estudiante': st.nombre_completo,
        'Promoción Estudiante': st.promo || '',
        Programa: st.programa || '',
        Correo: st.correo || '',
        Contacto: st.contacto || '',
        'Promoción Horario': sch.promocion || '',
        Periodo: sch.periodo || '',
        Día: sch.dia,
        'Hora Inicio': sch.hora_inicio,
        'Hora Fin': sch.hora_fin,
        'Código Clase': sch.codigo_clase || '',
        Materia: sch.materia,
        Docente: sch.docente || '',
      });
    }
  }

  return {
    detalleHorarios,
    resumenEstudiantes,
    totalHorarios: detalleHorarios.length,
    totalEstudiantesConHorario: resumenEstudiantes.filter(
      (r) => Number(r['Total Franjas']) > 0,
    ).length,
    totalEstudiantes: students.length,
  };
}
