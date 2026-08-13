import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { SupervisionForm } from './SupervisionForm';
import { PointForm } from './PointForm';
import { deleteSupervision, resolvePoint } from './actions';

export const dynamic = 'force-dynamic';

export default async function SupervisionPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('supervision.manage');
  if (!permissions.includes('supervision.view')) redirect('/dashboard/forbidden');

  const myEmployeeId = (session?.user as any)?.employeeId;

  const params = await searchParams;
  const dateStr = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null;
  const start = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (!dateStr) start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const prev = new Date(start);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(start);
  next.setDate(next.getDate() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const fmt = (d: Date) => d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const [schedules, employees] = await Promise.all([
    prisma.supervisionSchedule.findMany({
      where: { date: { gte: start, lt: end } },
      include: { employee: true, points: { orderBy: { createdAt: 'desc' } } },
      orderBy: [{ isGeneralSupervisor: 'desc' }, { area: 'asc' }]
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
      orderBy: { fullName: 'asc' }
    })
  ]);

  const employeeOptions = employees.map((e) => ({ id: e.id, label: `${e.fullName} (${e.employeeCode})` }));
  const scheduleOptions = schedules.map((s) => ({
    id: s.id,
    label: `${s.employee.fullName}${s.area ? ' — ' + s.area : ''}`
  }));

  const isAssignedToday = myEmployeeId
    ? schedules.some((s) => s.employeeId === myEmployeeId)
    : false;
  const canAddPoints = canManage || isAssignedToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">جدول الإشراف اليومي</h1>
        <p className="text-sm text-muted">توزيع المشرفين ونقاط الإشراف المسجلة أثناء اليوم</p>
      </div>

      <div className="flex items-center justify-between gap-3 card p-4">
        <Link
          href={`/supervision?date=${iso(prev)}`}
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          → اليوم السابق
        </Link>
        <div className="text-center">
          <p className="font-medium">{fmt(start)}</p>
          <p className="text-xs text-muted">المشرفون اليوم: {schedules.length}</p>
        </div>
        <Link
          href={`/supervision?date=${iso(next)}`}
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          اليوم التالي ←
        </Link>
      </div>

      {canManage && <SupervisionForm employees={employeeOptions} date={dateStr ?? iso(start)} />}

      <section>
        <h2 className="text-lg font-medium mb-3">مشرفو اليوم</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">المشرف</th>
                <th className="px-4 py-2 font-medium">نطاق الإشراف</th>
                <th className="px-4 py-2 font-medium">النقاط المسجلة</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-10 text-center text-muted">
                    لا يوجد مشرفون لهذا اليوم
                  </td>
                </tr>
              )}
              {schedules.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {s.employee.fullName}
                    {s.isGeneralSupervisor && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 mr-2">
                        مشرف عام
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{s.area ?? '—'}</td>
                  <td className="px-4 py-2">{s.points.length} نقطة</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteSupervision.bind(null, s.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {canAddPoints && scheduleOptions.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3">تسجيل نقطة إشراف</h2>
          <PointForm schedules={scheduleOptions} dateLabel={fmt(start)} />
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">نقاط الإشراف ({schedules.reduce((s, x) => s + x.points.length, 0)})</h2>
        <div className="space-y-3">
          {schedules.flatMap((s) => s.points).length === 0 && (
            <div className="card p-10 text-center text-muted text-sm">لا توجد نقاط مسجلة لهذا اليوم</div>
          )}
          {schedules.map((s) =>
            s.points.map((p) => (
              <div key={p.id} className="card p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <b className="text-brand">{s.employee.fullName}</b>
                    {s.area ? ` — ${s.area}` : ''}
                  </p>
                  <p className="text-sm text-ink mt-1">{p.description}</p>
                  <p className="text-xs text-muted mt-1">{new Date(p.createdAt).toLocaleString('ar-EG')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === 'resolved' ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">تمت المعالجة</span>
                  ) : (
                    <>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">متابعة</span>
                      {(canManage || s.employeeId === myEmployeeId) && (
                        <form action={resolvePoint.bind(null, p.id)}>
                          <button type="submit" className="text-xs text-emerald-600 hover:underline">
                            تمت المعالجة
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
