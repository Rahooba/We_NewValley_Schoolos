import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { DeleteButton } from '@/components/DeleteButton';
import { WarningForm } from './WarningForm';
import { deleteWarning } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function WarningsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('warnings.manage');
  if (!permissions.includes('warnings.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [warnings, total, warningCounts, students, thresholdSetting, breakSetting] = await Promise.all([
    prisma.warningLog.findMany({
      include: { student: { include: { class: true, section: true } }, sentBy: true },
      orderBy: { warningDate: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.warningLog.count(),
    prisma.warningLog.groupBy({
      by: ['studentId'],
      _count: { _all: true }
    }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.setting.findUnique({ where: { key: 'absence_warning_threshold_days' } }),
    prisma.setting.findUnique({ where: { key: 'absence_warning_break_days' } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const thresholdDays = Number(thresholdSetting?.value ?? '3');
  const breakDays = Number(breakSetting?.value ?? '5');

  const studentOptions = students.map((s) => ({
    id: s.id,
    label: [s.studentCode, s.fullName, [s.class?.name, s.section?.name].filter(Boolean).join(' - ')]
      .filter(Boolean)
      .join(' | ')
  }));

  const openByStudent = new Map<string, number>(
    warningCounts.map((w) => [w.studentId, w._count._all])
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today.getTime() - breakDays * 86400000);

  const eligibleList = await Promise.all(
    students.map(async (s) => {
      const days = await prisma.studentAttendance.count({
        where: {
          studentId: s.id,
          status: { in: ['ABSENT', 'EXCUSED'] },
          date: { gte: from, lt: new Date(today.getTime() + 86400000) }
        }
      });
      if (days < thresholdDays) return null;
      return { id: s.id, fullName: s.fullName, code: s.studentCode, days };
    })
  );
  const eligibleStudents = eligibleList.filter(Boolean) as {
    id: string;
    fullName: string;
    code: string;
    days: number;
  }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">إنذارات الغياب</h1>
        <p className="text-sm text-muted">
          إنذار تلقائي بعد {thresholdDays} أيام غياب خلال آخر {breakDays} أيام — يصدره شئون الطلاب
        </p>
      </div>

      {eligibleStudents.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3">طلاب تجاوزوا حد الغياب</h2>
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {eligibleStudents.map((e) => (
              <div key={e.id} className="border border-amber-300 bg-amber-50 rounded-sm px-3 py-2 text-sm">
                <b>{e.fullName}</b>
                <span className="text-muted text-xs block">{e.code} — {e.days} أيام غياب خلال آخر {breakDays} أيام</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">سجل الإنذارات</h2>
        {canManage && <WarningForm students={studentOptions} />}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">الفصل</th>
                <th className="px-4 py-2 font-medium">السبب</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">مصدر الإنذار</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {warnings.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-muted">
                    لا توجد إنذارات بعد
                  </td>
                </tr>
              )}
              {warnings.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {w.student.fullName}
                    <span className="text-xs text-muted block">
                      إنذار رقم {openByStudent.get(w.studentId) ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {[w.student.class?.name, w.student.section?.name].filter(Boolean).join(' - ') || '—'}
                  </td>
                  <td className="px-4 py-2">{w.reason}</td>
                  <td className="px-4 py-2">{new Date(w.warningDate).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">{w.sentBy?.fullName ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteWarning.bind(null, w.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
