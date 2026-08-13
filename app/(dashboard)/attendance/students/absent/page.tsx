import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { startOfToday } from '@/lib/date';

export default async function AbsentStudentsPage() {
  const date = startOfToday();
  const records = await prisma.studentAttendance.findMany({
    where: { date, status: { in: ['ABSENT', 'EXCUSED'] } },
    include: { student: { include: { class: true, section: true } } },
    orderBy: { student: { fullName: 'asc' } }
  });

  return (
    <div>
      <Link href="/attendance/students" className="text-sm text-muted flex items-center gap-1 mb-4 hover:text-brand">
        <ArrowRight size={14} /> رجوع لحضور الطلاب
      </Link>
      <h1 className="text-2xl font-display mb-1">الطلاب الغائبون اليوم</h1>
      <p className="text-sm text-muted mb-6">{records.length} طالب</p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الكود</th>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الفصل</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted">{r.student.studentCode}</td>
                <td className="px-4 py-3">{r.student.fullName}</td>
                <td className="px-4 py-3 text-muted">
                  {[r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    {r.status === 'EXCUSED' ? 'غائب بإذن' : 'غائب'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{r.note ?? '—'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  لا يوجد طلاب مسجلين كغائبين اليوم بعد
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
