import { redirect } from 'next/navigation';
import { list } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { FilesManager } from './FilesManager';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

async function listAllBlobs() {
  const all = [];
  let cursor: string | undefined;
  do {
    const page = await list({ limit: 1000, cursor });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && all.length < 5000);
  return all;
}

export default async function FilesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('lesson_plans.manage')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const allBlobs = await listAllBlobs();
  const sorted = [...allBlobs].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const total = sorted.length;
  const blobs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const urls = blobs.map((b) => b.url);

  const [plans, docs, sdocs, reports] = await Promise.all([
    prisma.lessonPlan.findMany({
      where: { fileUrl: { in: urls } },
      include: { subject: true, teacher: true }
    }),
    prisma.attendanceDocument.findMany({ where: { fileUrl: { in: urls } } }),
    prisma.studentDocument.findMany({ where: { fileUrl: { in: urls } }, include: { student: true } }),
    prisma.report.findMany({ where: { fileUrl: { in: urls } } })
  ]);

  const refs = new Map<string, string>();
  for (const p of plans) {
    if (p.fileUrl)
      refs.set(
        p.fileUrl,
        `خطة درس: ${p.subject.name} — ${p.teacher.fullName} — أسبوع ${new Date(p.weekOf).toLocaleDateString('ar-EG')}`
      );
  }
  for (const d of docs) {
    refs.set(
      d.fileUrl,
      `مستند حضور ${d.type === 'students' ? 'الطلاب' : 'الموظفين'} — ${new Date(d.date).toLocaleDateString('ar-EG')}`
    );
  }
  for (const s of sdocs) {
    refs.set(s.fileUrl, `مستند طالب: ${s.student.fullName} — ${s.name}`);
  }
  for (const r of reports) {
    if (r.fileUrl) refs.set(r.fileUrl, `تقرير: ${r.title}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">إدارة الملفات المرفوعة</h1>
        <p className="text-sm text-muted">
          استعراض وتعديل وحذف الملفات المخزنة مباشرةً — بديل عن الدخول إلى لوحة Vercel Blob
        </p>
      </div>

      <FilesManager
        files={blobs.map((b) => ({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt.toISOString(),
          ref: refs.get(b.url) ?? null
        }))}
      />

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
