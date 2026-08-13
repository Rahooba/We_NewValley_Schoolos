import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { ReportForm } from './ReportForm';
import { deleteReport } from './actions';

export default async function ReportsPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('reports.view');

  const [
    studentsCount,
    employeesCount,
    examsCount,
    assetsCount,
    visitorsCount,
    committeesCount,
    reports
  ] = await Promise.all([
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.exam.count(),
    prisma.asset.count(),
    prisma.visitorLog.count(),
    prisma.committee.count(),
    prisma.report.findMany({ orderBy: { createdAt: 'desc' }, take: 30 })
  ]);

  const stats = [
    { label: 'الطلاب النشطون', value: studentsCount },
    { label: 'العاملون النشطون', value: employeesCount },
    { label: 'الامتحانات', value: examsCount },
    { label: 'الأصناف بالمخازن', value: assetsCount },
    { label: 'زيارات مسجلة', value: visitorsCount },
    { label: 'اللجان', value: committeesCount }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display">التقارير</h1>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-display text-brand">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">سجل التقارير</h2>
        <ReportForm />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">العنوان</th>
                <th className="px-4 py-2 font-medium">الوحدة</th>
                <th className="px-4 py-2 font-medium">أنشأه</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                {canManage && <th className="px-4 py-2 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">{r.title}</td>
                  <td className="px-4 py-2">{r.module}</td>
                  <td className="px-4 py-2">{r.generatedBy ?? '—'}</td>
                  <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteReport.bind(null, r.id)} />
                    </td>
                  )}
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-6 text-center text-muted">لا توجد تقارير مسجلة بعد</td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
