import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PermissionGate } from '@/components/PermissionGate';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import Pagination from '@/components/Pagination';
import { GRADE_LABELS, SLOTS_BY_LEVEL } from '@/lib/examSlots';
import { updateExam, deleteExam } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ExamsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('exams.manage');
  const canSeeRemedial = permissions.includes('remedial.view');
  const canSeeEnrichment = permissions.includes('enrichment.view');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [exams, examTotal, classes, students, assessments, remedialThresholdSetting, enrichmentThresholdSetting] =
    await Promise.all([
      prisma.exam.findMany({
        include: { _count: { select: { marks: true, results: true } } },
        orderBy: { startDate: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE
      }),
      prisma.exam.count(),
      prisma.class.findMany({ orderBy: { level: 'asc' }, where: { level: { not: null } } }),
      prisma.student.findMany({
        where: { status: 'ACTIVE' },
        include: { class: true, section: true }
      }),
      prisma.formativeAssessment.findMany({
        where: { gradeLevel: { not: null } },
        include: { student: { include: { class: true, section: true } } }
      }),
      prisma.setting.findUnique({ where: { key: 'remedial_threshold_percent' } }),
      prisma.setting.findUnique({ where: { key: 'enrichment_threshold_percent' } })
    ]);

  const remedialThreshold = Number(remedialThresholdSetting?.value ?? '65');
  const enrichmentThreshold = Number(enrichmentThresholdSetting?.value ?? '90');
  const totalPages = Math.max(1, Math.ceil(examTotal / PAGE_SIZE));

  // متوسط كل طالب عبر تقييمات صفه (الشرائح) فقط
  const perStudent = new Map<string, { student: (typeof students)[number]; total: number; max: number }>();
  for (const a of assessments) {
    const cur = perStudent.get(a.studentId) ?? { student: a.student, total: 0, max: 0 };
    cur.total += Number(a.score);
    cur.max += Number(a.maxScore);
    perStudent.set(a.studentId, cur);
  }
  const withAvg = Array.from(perStudent.values()).map((x) => ({
    ...x,
    average: x.max > 0 ? (x.total / x.max) * 100 : 0
  }));

  const remedialStudents = withAvg
    .filter((x) => x.average < remedialThreshold)
    .sort((a, b) => a.average - b.average)
    .slice(0, 50);
  const enrichmentStudents = withAvg
    .filter((x) => x.average >= enrichmentThreshold)
    .sort((a, b) => b.average - a.average)
    .slice(0, 50);

  const studentsByLevel = new Map<number, number>();
  for (const s of students) {
    const level = s.class?.level;
    if (level) studentsByLevel.set(level, (studentsByLevel.get(level) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">الامتحانات والتقييمات</h1>
          <p className="text-sm text-muted mt-1">استعراض كل صف دراسي بمفرده مع تحليل النتائج</p>
        </div>
        <PermissionGate permission="exams.manage">
          <Link href="/exams/new" className="btn-primary">
            <Plus size={16} />
            إضافة امتحان
          </Link>
        </PermissionGate>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">الصفوف الدراسية</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/exams/grade/${c.level}`}
              className="card p-5 hover:border-brand transition-colors block"
            >
              <h3 className="font-display text-lg mb-1">{c.name}</h3>
              <p className="text-sm text-muted">
                {SLOTS_BY_LEVEL[c.level ?? 1].length} تقييم —{' '}
                {studentsByLevel.get(c.level ?? 0) ?? 0} طالب
              </p>
            </Link>
          ))}
        </div>
      </section>

      {canSeeRemedial && (
        <section>
          <h2 className="text-lg font-medium mb-3">
            الطلاب التحسينيون (أقل من {remedialThreshold}%) — {remedialStudents.length}
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">الصف</th>
                  <th className="px-4 py-2 font-medium">المتوسط</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {remedialStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      لا يوجد طلاب دون حد المعالجة
                    </td>
                  </tr>
                )}
                {remedialStudents.map((r) => (
                  <tr key={r.student.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{r.student.fullName}</td>
                    <td className="px-4 py-2 text-muted">{r.student.class?.name ?? '—'}</td>
                    <td className="px-4 py-2 font-medium text-red-600">{r.average.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      {r.student.class?.level && (
                        <Link
                          href={`/exams/grade/${r.student.class.level}`}
                          className="text-xs text-brand hover:underline"
                        >
                          صفحة الصف
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {canSeeEnrichment && (
        <section>
          <h2 className="text-lg font-medium mb-3">
            الطلاب الإثرائيون (من {enrichmentThreshold}% فأكثر) — {enrichmentStudents.length}
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">الصف</th>
                  <th className="px-4 py-2 font-medium">المتوسط</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {enrichmentStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      لا يوجد طلاب فوق حد الإثراء
                    </td>
                  </tr>
                )}
                {enrichmentStudents.map((r) => (
                  <tr key={r.student.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{r.student.fullName}</td>
                    <td className="px-4 py-2 text-muted">{r.student.class?.name ?? '—'}</td>
                    <td className="px-4 py-2 font-medium text-emerald-600">{r.average.toFixed(1)}%</td>
                    <td className="px-4 py-2">
                      {r.student.class?.level && (
                        <Link
                          href={`/exams/grade/${r.student.class.level}`}
                          className="text-xs text-brand hover:underline"
                        >
                          صفحة الصف
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">كل الامتحانات</h2>
        <ManageRows
          columns={[
            { key: 'name', label: 'اسم الامتحان' },
            { key: 'gradeLabel', label: 'الصف' },
            { key: 'startDateDisplay', label: 'من' },
            { key: 'endDateDisplay', label: 'إلى' },
            { key: 'marksCount', label: 'عدد الدرجات المدخلة' }
          ]}
          rows={exams.map((e) => ({
            id: e.id,
            _href: `/exams/${e.id}`,
            name: e.name,
            gradeLabel: e.gradeLevel ? GRADE_LABELS[e.gradeLevel] ?? '—' : 'عام',
            startDate: e.startDate.toISOString(),
            startDateDisplay: new Date(e.startDate).toLocaleDateString('ar-EG'),
            endDate: e.endDate.toISOString(),
            endDateDisplay: new Date(e.endDate).toLocaleDateString('ar-EG'),
            marksCount: e._count.marks
          }))}
          linkLabel="إدخال الدرجات"
          fields={
            [
              { name: 'name', label: 'اسم الامتحان', type: 'text', required: true },
              { name: 'startDate', label: 'من', type: 'date', required: true },
              { name: 'endDate', label: 'إلى', type: 'date', required: true }
            ] satisfies ManageField[]
          }
          updateAction={updateExam}
          deleteAction={deleteExam}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد امتحانات بعد"
        />
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>
    </div>
  );
}