import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { ActivityPanel } from '../activity/ActivityPanel';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('camps.manage')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = { category: 'project' };

  const [activities, total] = await Promise.all([
    prisma.activityRecord.findMany({
      where,
      include: {
        procedures: { orderBy: { createdAt: 'desc' } },
        documentation: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.activityRecord.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/professional-transformation" className="text-xs text-brand hover:underline">
          ← التحول الاحترافي
        </Link>
        <h1 className="text-2xl font-display mt-1">المشروعات الطلابية</h1>
        <p className="text-sm text-muted">YIL (الصف الثاني) و Nexa (الصف الثالث) — مسئول التحول الاحترافي</p>
      </div>

      <ActivityPanel
        category="project"
        activities={activities.map((a) => ({
          id: a.id,
          category: a.category,
          subtype: a.subtype,
          title: a.title,
          startDate: a.startDate?.toISOString() ?? null,
          endDate: a.endDate?.toISOString() ?? null,
          procedures: a.procedures.map((p) => ({
            id: p.id,
            notes: p.notes,
            fileUrl: p.fileUrl,
            createdAt: p.createdAt.toISOString()
          })),
          documentation: a.documentation.map((d) => ({
            id: d.id,
            photoUrl: d.photoUrl,
            caption: d.caption,
            createdAt: d.createdAt.toISOString()
          })),
          createdAt: a.createdAt.toISOString()
        }))}
      />

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}