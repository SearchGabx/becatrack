import { getAllStudentsWithSchedules } from '@/modules/horario/actions';
import HorarioWorkspace from '@/modules/horario/components/HorarioWorkspace';

export const dynamic = 'force-dynamic';

export default async function HorarioGestionPage() {
  const allStudents = await getAllStudentsWithSchedules();
  const prom = Array.from(
    new Set(
      allStudents
        .map((s) => s.promo)
        .filter((p): p is string => Boolean(p && p.trim() !== '')),
    ),
  )
    .sort()
    .reverse();

  return (
    <HorarioWorkspace
      initPromociones={prom}
      initAllStudents={allStudents}
      initialSection="gestion"
    />
  );
}
