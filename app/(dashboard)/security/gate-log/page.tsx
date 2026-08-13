import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { GateLogForm } from './GateLogForm';
import { deleteGateLog } from './actions';

export const dynamic = 'force-dynamic';

export default async function GateLogPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('security.gate_log.manage');
  if (!permissions.includes('security.gate_log.view')) redirect('/dashboard/forbidden');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [logs, students, employees] = await Promise.all([
    prisma.gateLog.findMany({
      where: { timestamp: { gte: today } },
      orderBy: { timestamp: 'desc' },
      take: 100
    }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, studentCode: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
      orderBy: { fullName: 'asc' }
    })
  ]);

  const studentOptions = students.map((s) => ({ id: s.id, label: `${s.fullName} (${s.studentCode})` }));
  const employeeOptions = employees.map((e) => ({ id: e.id, label: `${e.fullName} (${e.employeeCode})` }));

  const inCount = logs.filter((l) => l.direction === 'in').length;
  const outCount = logs.filter((l) => l.direction === 'out').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">سجل الحضور بالبوابة</h1>
        <p className="text-sm text-muted">تسجيل دخول وخروج الطلاب والموظفين والزوار</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-md">
        <div className="card p-4 text-center">
          <p className="text-2xl font-display text-emerald-600">{inCount}</p>
          <p className="text-xs text-muted">دخول</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-display text-red-600">{outCount}</p>
          <p className="text-xs text-muted">خروج</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-display">{logs.length}</p>
          <p className="text-xs text-muted">إجمالي اليوم</p>
        </div>
      </div>

      {canManage && <GateLogForm students={studentOptions} employees={employeeOptions} />}

      <section>
        <h2 className="text-lg font-medium mb-3">تسجيلات اليوم</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الوقت</th>
                <th className="px-4 py-2 font-medium">الاسم</th>
                <th className="px-4 py-2 font-medium">النوع</th>
                <th className="px-4 py-2 font-medium">الاتجاه</th>
                <th className="px-4 py-2 font-medium">ملاحظات</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-muted">
                    لا توجد تسجيلات اليوم
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2">{new Date(l.timestamp).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-2">{l.personName}</td>
                  <td className="px-4 py-2">
                    {l.personType === 'student' ? 'طالب' : l.personType === 'employee' ? 'موظف' : 'زائر'}
                  </td>
                  <td className="px-4 py-2">
                    {l.direction === 'in' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">دخول</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">خروج</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{l.notes ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteGateLog.bind(null, l.id)} />
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
