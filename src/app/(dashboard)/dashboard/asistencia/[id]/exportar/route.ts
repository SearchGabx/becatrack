import ExcelJS from 'exceljs';
import { auth } from '@/auth';
import { detalleReunion } from '@/modules/asistencia/queries';
import { ETIQUETA_ESTADO, formatoFecha } from '@/modules/asistencia/resumen';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.rol !== 'ADMIN') {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const detalle = await detalleReunion(id);
  if (!detalle) return Response.json({ error: 'Reunión no encontrada' }, { status: 404 });

  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Asistencia');
  hoja.columns = [
    { header: 'Documento', key: 'documento', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 32 },
    { header: 'Programa', key: 'programa', width: 26 },
    { header: 'Inicio', key: 'inicio', width: 18 },
    { header: 'Fin', key: 'fin', width: 18 },
    { header: 'Horas', key: 'horas', width: 8 },
    { header: 'Estado', key: 'estado', width: 12 },
  ];
  hoja.getRow(1).font = { bold: true };
  for (const f of detalle.filas) {
    hoja.addRow({
      documento: f.documento,
      nombre: f.nombre,
      programa: f.programa,
      inicio: f.inicio ? formatoFecha(f.inicio) : '-',
      fin: f.fin ? formatoFecha(f.fin) : '-',
      horas: f.horas ?? '-',
      estado: ETIQUETA_ESTADO[f.estado],
    });
  }

  const contenido = await libro.xlsx.writeBuffer();
  // Nombre de archivo seguro: sin comillas, tildes ni caracteres de control
  const nombre = detalle.reunion.nombre
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return new Response(contenido as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="asistencia_${nombre || 'reunion'}.xlsx"`,
    },
  });
}
