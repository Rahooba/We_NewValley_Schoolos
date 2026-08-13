import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { ViolationsPanel } from './ViolationsPanel';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ViolationsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('violations.view')) redirect('/dashboard/forbidden');

  const canRecord = permissions.includes('violations.record');
  const canAct = permissions.includes('violations.act');
  const roleLevel = (session?.user as any)?.roleLevel ?? 0;
  const isDirector = permissions.includes('users.manage') || roleLevel >= 90;
  const isPTOfficer = permissions.includes('violations.record') && !permissions.includes('violations.act');
  const isSocialSpecialist = permissions.includes('violations.act') && !permissions.includes('violations.record');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  // Count minor violations per student for director gating
  const minorGroups = await prisma.studentViolation.groupBy({
    by: ['studentId'],
    where: { severity: 'minor' },
    _count: { _all: true }
  });
  const minorOverlapIds = minorGroups
    .filter((g) => g._count._all >= 2)
    .map((g) => g.studentId);

  const where = isPTOfficer
    ? {}
    : isDirector
      ? {
          OR: [
            { severity: { not: 'minor' } },
            ...(minorOverlapIds.length > 0
              ? [{ severity: 'minor', studentId: { in: minorOverlapIds } }]
              : [])
          ]
        }
      : isSocialSpecialist
        ? { severity: { not: 'minor' } }
        : { AND: [{ severity: { not: 'minor' } }, { severity: 'minor' }] };

  const [violations, total, students] = await Promise.all([
    prisma.studentViolation.findMany({
      where,
      include: { student: { include: { class: true, section: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.studentViolation.count({ where }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/professional-transformation" className="text-xs text-brand hover:underline">
          ← التحول الاحترافي
        </Link>
        <h1 className="text-2xl font-display mt-1">مخالفات الطلاب</h1>
        <p className="text-sm text-muted">
          مسئول التحول الاحترافي يسجل ويراقب — الأخصائي الاجتماعي يبت في المخالفات
        </p>
      </div>

      <ViolationsPanel
        canRecord={canRecord}
        canAct={canAct}
        isPTOfficer={isPTOfficer}
        violations={violations.map((v) => ({
          id: v.id,
          studentName: v.student.fullName,
          studentCode: v.student.studentCode,
          className: [v.student.class?.name, v.student.section?.name].filter(Boolean).join(' - ') || '—',
          severity: v.severity,
          description: v.description,
          recordedBy: v.recordedBy,
          actionTaken: v.actionTaken,
          actionTakenBy: v.actionTakenBy,
          createdAt: v.createdAt.toISOString()
        }))}
        students={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          studentCode: s.studentCode,
          className: [s.class?.name, s.section?.name].filter(Boolean).join(' - ') || undefined
        }))}
      />

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}