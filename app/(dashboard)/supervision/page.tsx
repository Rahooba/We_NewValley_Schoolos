import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfToday, endOfToday, startOfWeek, toISODateLocal } from '@/lib/date';
import { DeleteButton } from '@/components/DeleteButton';
import { SupervisionForm } from './SupervisionForm';
import { PointForm } from './PointForm';
import { WeeklySupervisionTable, type WeekDayCell } from './WeeklySupervisionTable';
import { deleteSupervision, resolvePoint } from './actions';

export const dynamic = 'force-dynamic';

export default async function SupervisionPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
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

  if (params.view === 'week') {
    // Week starts Monday — same convention as attendance reports (computeWeek).
    const anchor = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
    const weekStart = startOfWeek(anchor);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekLast = new Date(weekEnd);
    weekLast.setDate(weekLast.getDate() - 1);
    const today = startOfToday();
    const todayInWeek = today >= weekStart && today < weekEnd;
    const todayEnd = endOfToday();

    const [weekSchedules, employees, todayAttendance] = await Promise.all([
      prisma.supervisionSchedule.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
        include: {
          employee: { select: { id: true, fullName: true } },
          points: { select: { id: true } }
        },
        orderBy: [{ isGeneralSupervisor: 'desc' }, { area: 'asc' }]
      }),
      prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, fullName: true, employeeCode: true },
        orderBy: { fullName: 'asc' }
      }),
      todayInWeek
        ? prisma.employeeAttendance.findMany({
            where: { date: { gte: today, lt: todayEnd } },
            select: { employeeId: true, status: true }
          })
        : Promise.resolve([] as Awaited<ReturnType<typeof prisma.employeeAttendance.findMany>>)
    ]);

    // Same attendance rule as the daily view — applied to today's column only;
    // other days show all employees because absence is unknown outside today.
    const attendanceMarked = todayAttendance.length > 0;
    const absentIdSet = new Set(
      todayAttendance.filter((a) => a.status === 'ABSENT').map((a) => a.employeeId)
    );
    const assignableToday = attendanceMarked
      ? employees.filter((e) => !absentIdSet.has(e.id))
      : employees;
    const excludedAbsentCount = employees.filter((e) => absentIdSet.has(e.id)).length;

    const byDayISO = new Map<string, (typeof weekSchedules)[number][]>();
    for (const s of weekSchedules) {
      const iso = toISODateLocal(new Date(s.date));
      const list = byDayISO.get(iso);
      if (list) list.push(s);
      else byDayISO.set(iso, [s]);
    }

    const days: WeekDayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const iso = toISODateLocal(d);
      const daySchedules = byDayISO.get(iso) ?? [];
      const isToday = todayInWeek && toISODateLocal(today) === iso;
      days.push({
        dateISO: iso,
        label: d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'numeric' }),
        isToday,
        supervisors: daySchedules.map((s) => ({
          id: s.id,
          name: s.employee.fullName,
          isGeneralSupervisor: s.isGeneralSupervisor,
          area: s.area,
          pointsCount: s.points.length
        })),
        assignable: (isToday ? assignableToday : employees).map((e) => ({
          id: e.id,
          label: `${e.fullName} (${e.employeeCode})`
        }))
      });
    }

    const prevWeek = new Date(weekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const nextWeek = new Date(weekEnd);

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display mb-1">جدول الإشراف الأسبوعي</h1>
            <p className="text-sm text-muted">
              من {weekStart.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })} إلى{' '}
              {weekLast.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link
            href={`/supervision?date=${dateStr ?? toISODateLocal(start)}`}
            className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
          >
            العرض اليومي
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 card p-4">
          <Link
            href={`/supervision?view=week&date=${toISODateLocal(prevWeek)}`}
            className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
          >
            → الأسبوع السابق
          </Link>
          <div className="text-center">
            <p className="font-medium">{days.length} أيام</p>
            <p className="text-xs text-muted">إجمالي المشرفين: {weekSchedules.length}</p>
          </div>
          <Link
            href={`/supervision?view=week&date=${toISODateLocal(nextWeek)}`}
            className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
          >
            الأسبوع التالي ←
          </Link>
        </div>

        {canManage && (
          <div className="space-y-3">
            {attendanceMarked === false && todayInWeek && (
              <div className="card p-4 border-amber-300 bg-amber-50 text-sm text-amber-800 flex items-center justify-between gap-3 flex-wrap">
                <p>
                  تنبيه: حضور اليوم لم يُسجَّل بعد — سيرى عمود اليوم كل الموظفين ولن يُستبعد
                  الغائبون تلقائيًا (بقية الأيام تظهر كل الموظفين دائمًا).
                </p>
                <Link
                  href="/attendance/employees"
                  className="text-xs text-amber-800 border border-amber-300 rounded-sm px-3 py-1.5 hover:bg-amber-100 shrink-0"
                >
                  تسجيل الحضور أولاً
                </Link>
              </div>
            )}
            {attendanceMarked && excludedAbsentCount > 0 && (
              <p className="text-xs text-muted">
                تم استبعاد {excludedAbsentCount} موظف غائب من قائمة مشرفي اليوم فقط
              </p>
            )}
          </div>
        )}

        <WeeklySupervisionTable days={days} canManage={canManage} />
      </div>
    );
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const prev = new Date(start);
  prev.setDate(prev.getDate() - 1);
  const next = new Date(start);
  next.setDate(next.getDate() + 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const fmt = (d: Date) => d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const [schedules, employees, attendanceRows] = await Promise.all([
    prisma.supervisionSchedule.findMany({
      where: { date: { gte: start, lt: end } },
      include: { employee: true, points: { orderBy: { createdAt: 'desc' } } },
      orderBy: [{ isGeneralSupervisor: 'desc' }, { area: 'asc' }]
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.employeeAttendance.findMany({
      where: { date: { gte: start, lt: end } },
      select: { employeeId: true, status: true }
    })
  ]);

  // Reuses the same EmployeeAttendance data as the attendance-marking flow —
  // never a second/parallel attendance source.
  const attendanceMarked = attendanceRows.length > 0;
  const absentIdSet = new Set(
    attendanceRows.filter((a) => a.status === 'ABSENT').map((a) => a.employeeId)
  );
  // An absent teacher must never be assignable — but only when attendance was
  // actually marked for this day; otherwise absence is unknown and the UI says so
  // instead of silently assuming everyone is present.
  const assignableEmployees = attendanceMarked
    ? employees.filter((e) => !absentIdSet.has(e.id))
    : employees;
  const excludedAbsentCount = employees.filter((e) => absentIdSet.has(e.id)).length;

  const employeeOptions = assignableEmployees.map((e) => ({ id: e.id, label: `${e.fullName} (${e.employeeCode})` }));
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display mb-1">جدول الإشراف اليومي</h1>
          <p className="text-sm text-muted">توزيع المشرفين ونقاط الإشراف المسجلة أثناء اليوم</p>
        </div>
        <Link
          href={`/supervision?view=week&date=${dateStr ?? toISODateLocal(start)}`}
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          العرض الأسبوعي
        </Link>
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

      {canManage && (
        <div className="space-y-3">
          {attendanceMarked === false &&
            start.toDateString() === new Date().toDateString() && (
              <div className="card p-4 border-amber-300 bg-amber-50 text-sm text-amber-800 flex items-center justify-between gap-3 flex-wrap">
                <p>
                  تنبيه: حضور اليوم لم يُسجَّل بعد — ستظهر كل الموظفين في قائمة المشرفين ولن يُستبعد
                  الغائبون تلقائيًا.
                </p>
                <Link
                  href="/attendance/employees"
                  className="text-xs text-amber-800 border border-amber-300 rounded-sm px-3 py-1.5 hover:bg-amber-100 shrink-0"
                >
                  تسجيل الحضور أولاً
                </Link>
              </div>
            )}
          {attendanceMarked && excludedAbsentCount > 0 && (
            <p className="text-xs text-muted">
              تم استبعاد {excludedAbsentCount} موظف غائب اليوم من قائمة المشرفين
            </p>
          )}
          <SupervisionForm employees={employeeOptions} date={dateStr ?? iso(start)} />
        </div>
      )}

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
