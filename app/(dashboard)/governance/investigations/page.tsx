import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { InvestigationPanel } from './InvestigationPanel';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function InvestigationCommitteePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('investigation_committee.manage')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [committees, total, employees, students] = await Promise.all([
    prisma.investigationCommittee.findMany({
      include: {
        relatedStudent: { select: { id: true, fullName: true, studentCode: true } },
        relatedEmployee: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.investigationCommittee.count(),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true }
    }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, studentCode: true }
    })
  ]);

  const employeeNames = new Map(employees.map((e) => [e.id, e.fullName]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/governance/board" className="text-xs text-brand hover:underline">
          ← الحوكمة والتواصل
        </Link>
        <h1 className="text-2xl font-display mt-1">لجنة الاستجوابات الداخلية</h1>
        <p className="text-sm text-muted">
          تشكيل لجان تحقيق، تسجيل رأي اللجنة ورأي الإدارة، وإغلاق القضايا — المدير التنفيذي / المدير الأكاديمي فقط
        </p>
      </div>

      <InvestigationPanel
        canManage={true}
        employees={employees.map((e) => ({ id: e.id, fullName: e.fullName }))}
        employeeNames={employeeNames}
        studentOptions={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode
        }))}
        committees={committees.map((c) => ({
          id: c.id,
          subject: c.subject,
          memberNames: c.memberIds.map((mid) => employeeNames.get(mid) ?? 'موظف محذوف'),
          committeeOpinion: c.committeeOpinion,
          adminOpinion: c.adminOpinion,
          status: c.status,
          relatedStudentName: c.relatedStudent?.fullName ?? null,
          relatedStudentCode: c.relatedStudent?.studentCode ?? null,
          relatedEmployeeName: c.relatedEmployee?.fullName ?? null,
          createdAt: c.createdAt.toISOString()
        }))}
      />
      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
