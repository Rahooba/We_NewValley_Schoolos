import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { startOfToday } from '@/lib/date';
import { PermissionGate } from '@/components/PermissionGate';
import { EmployeeAttendanceForm } from './AttendanceForm';
import { AttendanceDocumentUpload } from '../_components/AttendanceDocumentUpload';
import { FingerprintImport } from '../_components/FingerprintImport';

export default async function EmployeeAttendancePage() {
  const date = startOfToday();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [docs, employees] = await Promise.all([
    prisma.attendanceDocument.findMany({
      where: { type: 'employees', date: { gte: monthStart } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { attendance: { where: { date } } },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const docItems = docs.map((d) => ({
    id: d.id,
    date: d.date.toISOString(),
    fileUrl: d.fileUrl,
    notes: d.notes
  }));

  const rows = employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    employeeCode: e.employeeCode,
    position: e.position ?? '',
    status: e.attendance[0]?.status ?? null
  }));

  const presentCount = rows.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = rows.filter((r) => r.status === 'ABSENT' || r.status === 'EXCUSED').length;
  const unmarkedCount = rows.filter((r) => r.status === null).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display mb-1">حضور وغياب الموظفين</h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/attendance/employees/present" className="card px-4 py-2 hover:border-brand">
            حاضر: <b>{presentCount}</b>
          </Link>
          <Link href="/attendance/employees/absent" className="card px-4 py-2 hover:border-brand">
            غائب: <b>{absentCount}</b>
          </Link>
          <span className="card px-4 py-2 text-muted">لم يُسجَّل بعد: <b>{unmarkedCount}</b></span>
        </div>
      </div>

      <AttendanceDocumentUpload type="employees" docs={docItems} />

      <PermissionGate permission="attendance.employees.manage">
        <FingerprintImport employeeCodes={employees.map((e) => e.employeeCode)} />
        <EmployeeAttendanceForm employees={rows} />
      </PermissionGate>
    </div>
  );
}
