import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfToday } from '@/lib/date';
import { PermissionGate } from '@/components/PermissionGate';
import { StudentAttendanceForm } from './AttendanceForm';
import { AttendanceDocumentUpload } from '../_components/AttendanceDocumentUpload';

export default async function StudentAttendancePage() {
  const date = startOfToday();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [docs, students] = await Promise.all([
    prisma.attendanceDocument.findMany({
      where: { type: 'students', date: { gte: monthStart } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        class: true,
        section: true,
        attendance: { where: { date } }
      },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const docItems = docs.map((d) => ({
    id: d.id,
    date: d.date.toISOString(),
    fileUrl: d.fileUrl,
    notes: d.notes
  }));

  const rows = students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    studentCode: s.studentCode,
    className: [s.class?.name, s.section?.name].filter(Boolean).join(' - ') || '—',
    status: s.attendance[0]?.status ?? null
  }));

  const presentCount = rows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = rows.filter((r) => r.status === 'ABSENT' || r.status === 'EXCUSED').length;
  const unmarkedCount = rows.filter((r) => r.status === null).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display mb-1">حضور وغياب الطلاب</h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/attendance/students/present" className="card px-4 py-2 hover:border-brand">
            حاضر: <b>{presentCount}</b>
          </Link>
          <Link href="/attendance/students/absent" className="card px-4 py-2 hover:border-brand">
            غائب: <b>{absentCount}</b>
          </Link>
          <span className="card px-4 py-2 text-muted">لم يُسجَّل بعد: <b>{unmarkedCount}</b></span>
        </div>
      </div>

      <AttendanceDocumentUpload type="students" docs={docItems} />

      <PermissionGate permission="attendance.students.manage">
        <StudentAttendanceForm students={rows} />
      </PermissionGate>
    </div>
  );
}
