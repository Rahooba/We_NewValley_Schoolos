import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { startOfToday } from '@/lib/date';

export default async function AbsentEmployeesPage() {
  const date = startOfToday();
  const records = await prisma.employeeAttendance.findMany({
    where: { date, status: { in: ['ABSENT', 'EXCUSED'] } },
    include: { employee: true },
    orderBy: { employee: { fullName: 'asc' } }
  });

  return (
    <div>
      <Link href="/attendance/employees" className="text-sm text-muted flex items-center gap-1 mb-4 hover:text-brand">
        <ArrowRight size={14} /> رجوع لحضور الموظفين
      </Link>
      <h1 className="text-2xl font-display mb-1">الموظفون الغائبون اليوم</h1>
      <p className="text-sm text-muted mb-6">{records.length} موظف</p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الكود</th>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الوظيفة</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted">{r.employee.employeeCode}</td>
                <td className="px-4 py-3">{r.employee.fullName}</td>
                <td className="px-4 py-3 text-muted">{r.employee.position ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    {r.status === 'EXCUSED' ? 'غائب بإذن' : 'غائب'}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  لا يوجد موظفون مسجلون كغائبين اليوم بعد
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
