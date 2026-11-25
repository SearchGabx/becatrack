import { requireModule } from '@/lib/guards';
import {
  getPromociones,
  getAllStudentsWithSchedules,
} from '@/modules/horario/actions';
import HorarioWorkspace from '@/modules/horario/components/HorarioWorkspace';

export const dynamic = 'force-dynamic';

export default async function HorarioGestionPage() {
  await requireModule('horario');

  const [prom, allStudents] = await Promise.all([
    getPromociones(),
    getAllStudentsWithSchedules(),
  ]);

  return (
    <HorarioWorkspace
      initPromociones={prom}
      initAllStudents={allStudents}
      initialSection="gestion"
    />
  );
}
