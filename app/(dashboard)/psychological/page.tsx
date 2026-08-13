import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { PsychologicalCases } from './PsychologicalCases';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function PsychologicalCasesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [cases, total, students] = await Promise.all([
    prisma.psychologicalCase.findMany({
      include: { student: true },
      orderBy: { updatedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.psychologicalCase.count(),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">الحالات النفسية</h1>
        <p className="text-sm text-muted">متابعة الحالات النفسية والجلسات — الأخصائي النفسي</p>
      </div>

      <PsychologicalCases
        cases={cases.map((c) => ({
          id: c.id,
          studentId: c.studentId,
          studentName: c.student.fullName,
          title: c.title,
          description: c.description,
          status: c.status,
          sessions: c.sessions,
          notes: c.notes,
          nextSessionAt: c.nextSessionAt ? c.nextSessionAt.toISOString() : null,
          updatedAt: c.updatedAt.toISOString()
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
