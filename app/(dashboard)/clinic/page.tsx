import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { ClinicPanel } from './ClinicPanel';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ClinicPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('clinic.view')) redirect('/dashboard/forbidden');

  const canManage = permissions.includes('clinic.manage');
  const canManageCleanliness = permissions.includes('clinic.cleanliness.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const notToday = { NOT: { date: { gte: startOfToday, lt: endOfToday } } };

  const caseInclude = { student: { include: { class: true, section: true } } };

  const [todayCases, recentCases, recentTotal, cleanliness, cleanlinessTotal, students] = await Promise.all([
    prisma.clinicCase.findMany({
      where: { date: { gte: startOfToday, lt: endOfToday } },
      include: caseInclude,
      orderBy: { date: 'desc' }
    }),
    prisma.clinicCase.findMany({
      where: notToday,
      include: caseInclude,
      orderBy: { date: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.clinicCase.count({ where: notToday }),
    prisma.clinicCleanlinessLog.findMany({
      orderBy: { date: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.clinicCleanlinessLog.count(),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(recentTotal, cleanlinessTotal) / PAGE_SIZE)
  );

  const mapCase = (c: (typeof recentCases)[number]) => ({
    id: c.id,
    date: c.date.toISOString(),
    studentName: c.student.fullName,
    studentCode: c.student.studentCode,
    className: [c.student.class?.name, c.student.section?.name].filter(Boolean).join(' - ') || '—',
    condition: c.condition,
    actionTaken: c.actionTaken
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">العيادة المدرسية</h1>
        <p className="text-sm text-muted">
          حالات اليوم: {todayCases.length} — الزائرة الصحية (إدارة) / المدير التنفيذي والأكاديمي (اطلاع)
        </p>
      </div>

      <ClinicPanel
        canManage={canManage}
        canManageCleanliness={canManageCleanliness}
        todayCases={todayCases.map(mapCase)}
        recentCases={recentCases.map(mapCase)}
        cleanliness={cleanliness.map((l) => ({
          id: l.id,
          date: l.date.toISOString(),
          status: l.status,
          notes: l.notes
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