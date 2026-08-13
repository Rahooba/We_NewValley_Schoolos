import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { DeleteButton } from '@/components/DeleteButton';
import { ScheduleForm } from './ScheduleForm';
import { deleteVisit, markVisitComplete } from '../../actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function VisitSchedulePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('visit_schedule.manage') || permissions.includes('quality.manage');
  if (!permissions.includes('visit_schedule.view') && !permissions.includes('quality.view')) {
    redirect('/dashboard/forbidden');
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      include: { employee: true },
      orderBy: [{ plannedVisitDate: 'asc' }, { visitedAt: 'desc' }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.visit.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true },
    orderBy: { fullName: 'asc' }
  });

  const employeeOptions = employees.map((e) => ({ id: e.id, label: e.fullName }));

  const upcoming = visits.filter(
    (v) => v.status === 'scheduled' && (!v.plannedVisitDate || v.plannedVisitDate >= today)
  );
  const completed = visits.filter((v) => v.status === 'completed');
  const cancelled = visits.filter((v) => v.status === 'cancelled');

  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString('ar-EG') : '—');
  const isOverdue = (v: (typeof visits)[number]) =>
    v.plannedVisitDate && v.plannedVisitDate < today && v.status === 'scheduled';

  const renderTable = (rows: typeof visits) => (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-paper text-muted text-right">
          <tr>
            <th className="px-4 py-2 font-medium">الزيارة المجدولة</th>
            <th className="px-4 py-2 font-medium">تاريخ التنفيذ</th>
            <th className="px-4 py-2 font-medium">الزائر</th>
            <th className="px-4 py-2 font-medium">المعلم / الموظف</th>
            <th className="px-4 py-2 font-medium">الغرض</th>
            <th className="px-4 py-2 font-medium">الحالة</th>
            {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={canManage ? 7 : 6} className="px-4 py-6 text-center text-muted">
                لا توجد زيارات
              </td>
            </tr>
          )}
          {rows.map((v) => (
            <tr key={v.id} className="border-t border-border">
              <td className={`px-4 py-2 ${isOverdue(v) ? 'text-red-600 font-medium' : ''}`}>
                {fmt(v.plannedVisitDate)}
                {isOverdue(v) && <span className="text-xs text-red-600 block">متأخرة</span>}
              </td>
              <td className="px-4 py-2">{fmt(v.visitedAt)}</td>
              <td className="px-4 py-2">{v.visitor}</td>
              <td className="px-4 py-2">{v.employee?.fullName ?? '—'}</td>
              <td className="px-4 py-2">{v.purpose ?? '—'}</td>
              <td className="px-4 py-2">
                {v.status === 'completed' ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">منفذة</span>
                ) : v.status === 'cancelled' ? (
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">ملغاة</span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">مجدولة</span>
                )}
              </td>
              {canManage && (
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    {v.status === 'scheduled' && (
                      <form action={markVisitComplete.bind(null, v.id)}>
                        <button type="submit" className="text-xs text-emerald-600 hover:underline">
                          تمت الزيارة
                        </button>
                      </form>
                    )}
                    <DeleteButton onDelete={deleteVisit.bind(null, v.id)} />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display mb-1">جدول الزيارات الإشرافية</h1>
          <p className="text-sm text-muted">تخطيط زيارات الجودة ومتابعة تنفيذها</p>
        </div>
        <Link href="/quality" className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand">
          سجل الزيارات
        </Link>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">جدولة زيارة جديدة</h2>
          <ScheduleForm employees={employeeOptions} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">الزيارات المجدولة ({upcoming.length})</h2>
        {renderTable(upcoming)}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">الزيارات المنفذة ({completed.length})</h2>
        {renderTable(completed)}
      </section>

      {cancelled.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3">الزيارات الملغاة ({cancelled.length})</h2>
          {renderTable(cancelled)}
        </section>
      )}

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
