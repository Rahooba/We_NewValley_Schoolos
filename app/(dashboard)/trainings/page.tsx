import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { TrainingForm } from './TrainingForm';
import { deleteTraining } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function TrainingsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('trainings.manage');
  if (!permissions.includes('trainings.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [trainings, total, employees] = await Promise.all([
    prisma.training.findMany({ orderBy: { date: 'desc' }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    prisma.training.count(),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const employeeOptions = employees.map((e) => ({ id: e.id, label: `${e.fullName} (${e.employeeCode})` }));
  const employeeName = Object.fromEntries(employees.map((e) => [e.id, e.fullName]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">التدريبات الداخلية</h1>
        <p className="text-sm text-muted">سجل التدريبات المنفذة داخل المدرسة والحضور</p>
      </div>

      {canManage && <TrainingForm employees={employeeOptions} />}

      <section>
        <h2 className="text-lg font-medium mb-3">سجل التدريبات ({total})</h2>
        <div className="space-y-3">
          {trainings.length === 0 && (
            <div className="card p-10 text-center text-muted text-sm">لا توجد تدريبات مسجلة بعد</div>
          )}
          {trainings.map((t) => (
            <div key={t.id} className="card p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{t.title}</p>
                  <span className="text-xs text-muted">
                    {new Date(t.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {t.description && <p className="text-sm text-ink mt-1">{t.description}</p>}
                {t.trainerName && (
                  <p className="text-sm text-muted mt-1">
                    المدرب: <b className="text-ink">{t.trainerName}</b>
                  </p>
                )}
                <p className="text-sm mt-2">
                  <span className="text-xs text-muted">الحضور ({t.attendeeIds.length}):</span>
                  <span className="ml-1 text-xs">
                    {t.attendeeIds.map((id) => employeeName[id] ?? id).join('، ')}
                  </span>
                </p>
              </div>
              {canManage && <DeleteButton onDelete={deleteTraining.bind(null, t.id)} />}
            </div>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>
    </div>
  );
}
