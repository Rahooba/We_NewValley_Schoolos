import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { ShiftForm } from './ShiftForm';
import { deleteShift } from './actions';

export const dynamic = 'force-dynamic';

export default async function ShiftsPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('security.shifts.manage');
  if (!permissions.includes('security.shifts.view')) redirect('/dashboard/forbidden');

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

  const [shifts, employees] = await Promise.all([
    prisma.securityShift.findMany({
      where: { date: { gte: start, lt: end } },
      include: { employee: true },
      orderBy: { shift: 'asc' }
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true, position: true },
      orderBy: { fullName: 'asc' }
    })
  ]);

  const employeeOptions = employees.map((e) => ({
    id: e.id,
    label: `${e.fullName} (${e.employeeCode})${e.position ? ' — ' + e.position : ''}`
  }));

  const shiftLabel: Record<string, string> = { morning: 'صباحية', evening: 'مسائية', night: 'ليلية' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">ورديات الأمن</h1>
        <p className="text-sm text-muted">توزيع ورديات أفراد الأمن يوميًا</p>
      </div>

      <div className="flex items-center justify-between gap-3 card p-4">
        <Link
          href={`/security/shifts?date=${iso(prev)}`}
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          → اليوم السابق
        </Link>
        <div className="text-center">
          <p className="font-medium">{fmt(start)}</p>
          <p className="text-xs text-muted">الحضور اليوم: {shifts.length}</p>
        </div>
        <Link
          href={`/security/shifts?date=${iso(next)}`}
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          اليوم التالي ←
        </Link>
      </div>

      {canManage && <ShiftForm employees={employeeOptions} date={dateStr ?? iso(start)} />}

      <section>
        <h2 className="text-lg font-medium mb-3">ورديات اليوم</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الموظف</th>
                <th className="px-4 py-2 font-medium">الوظيفة</th>
                <th className="px-4 py-2 font-medium">الوردية</th>
                <th className="px-4 py-2 font-medium">ملاحظات</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-10 text-center text-muted">
                    لا توجد ورديات لهذا اليوم
                  </td>
                </tr>
              )}
              {shifts.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {s.employee.fullName} <span className="text-xs text-muted">({s.employee.employeeCode})</span>
                  </td>
                  <td className="px-4 py-2">{s.employee.position ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        s.shift === 'night'
                          ? 'bg-gray-800 text-white'
                          : s.shift === 'evening'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {shiftLabel[s.shift]}
                    </span>
                  </td>
                  <td className="px-4 py-2">{s.notes ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteShift.bind(null, s.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}
