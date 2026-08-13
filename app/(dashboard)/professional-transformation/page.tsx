import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { ProfessionalTransformation } from './ProfessionalTransformation';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ProfessionalTransformationPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const lateWhere = { status: 'LATE' as const };

  const [studentLate, studentBehavior, employeeBehavior, students, employees, lateTotal, studentBehaviorTotal, employeeBehaviorTotal] =
    await Promise.all([
      prisma.studentAttendance.findMany({
        where: lateWhere,
        include: { student: { include: { class: true, section: true } } },
        orderBy: { date: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE
      }),
      prisma.studentBehavior.findMany({
        include: { student: true },
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE
      }),
      prisma.employeeBehavior.findMany({
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE
      }),
      prisma.student.findMany({
        where: { status: 'ACTIVE' },
        include: { class: true, section: true },
        orderBy: { fullName: 'asc' }
      }),
      prisma.employee.findMany({ where: { status: 'ACTIVE' }, orderBy: { fullName: 'asc' } }),
      prisma.studentAttendance.count({ where: lateWhere }),
      prisma.studentBehavior.count(),
      prisma.employeeBehavior.count()
    ]);
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(lateTotal, studentBehaviorTotal, employeeBehaviorTotal) / PAGE_SIZE)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">التحول الاحترافي</h1>
        <p className="text-sm text-muted">
          متابعة التأخيرات والرصد السلوكي — مسئول التحول الاحترافي وشئون الطلاب
        </p>
      </div>

      <ProfessionalTransformation
        studentLate={studentLate.map((r) => ({
          id: r.id,
          date: r.date.toISOString(),
          studentId: r.studentId,
          studentName: r.student.fullName,
          studentCode: r.student.studentCode,
          className: [r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || '—',
          note: r.note
        }))}
        studentBehavior={studentBehavior.map((b) => ({
          id: b.id,
          type: b.type,
          description: b.description,
          studentName: b.student.fullName,
          createdAt: b.createdAt.toISOString()
        }))}
        employeeBehavior={employeeBehavior.map((b) => ({
          id: b.id,
          type: b.type,
          description: b.description,
          employeeName: b.employee.fullName,
          createdAt: b.createdAt.toISOString()
        }))}
        students={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode,
          className: [s.class?.name, s.section?.name].filter(Boolean).join(' - ') || undefined
        }))}
        employees={employees.map((e) => ({ id: e.id, fullName: e.fullName }))}
      />

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
