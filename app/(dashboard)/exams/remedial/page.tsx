import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { RemedialFlagForm, FormativeAssessmentForm } from './RemedialQuickForms';
import { resolveRemedialFlag, deleteRemedialFlag, deleteFormativeAssessment } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function RemedialPage({
  searchParams
}: {
  searchParams: Promise<{ examId?: string; student?: string; subject?: string; page?: string }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('remedial.manage');
  if (!permissions.includes('remedial.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const thresholdSetting = await prisma.setting.findUnique({
    where: { key: 'remedial_threshold_percent' }
  });
  const threshold = Number(thresholdSetting?.value ?? '65');

  const [exams, students, flags, flagTotal, openFlagCount, assessments, assessmentTotal, selectedExam] = await Promise.all([
    prisma.exam.findMany({ orderBy: { startDate: 'desc' } }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    }),
    prisma.remedialFlag.findMany({
      include: { student: { include: { class: true, section: true } }, exam: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.remedialFlag.count(),
    prisma.remedialFlag.count({ where: { status: 'open' } }),
    prisma.formativeAssessment.findMany({
      include: { student: true },
      orderBy: { assessmentDate: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.formativeAssessment.count(),
    params.examId
      ? prisma.exam.findUnique({ where: { id: params.examId } })
      : prisma.exam.findFirst({ orderBy: { startDate: 'desc' } })
  ]);

  const selectedExamId = selectedExam?.id ?? exams[0]?.id ?? null;
  const marks = selectedExamId
    ? await prisma.mark.findMany({
        where: { examId: selectedExamId },
        include: { student: { include: { class: true, section: true } } }
      })
    : [];

  const perStudent = new Map<
    string,
    { student: (typeof students)[number]; total: number; max: number; worstSubject: string; worstPct: number }
  >();
  for (const m of marks) {
    const pct = Number(m.maxScore) > 0 ? (Number(m.score) / Number(m.maxScore)) * 100 : 0;
    const cur = perStudent.get(m.studentId) ?? {
      student: m.student,
      total: 0,
      max: 0,
      worstSubject: m.subject,
      worstPct: pct
    };
    cur.total += Number(m.score);
    cur.max += Number(m.maxScore);
    if (pct < cur.worstPct) {
      cur.worstPct = pct;
      cur.worstSubject = m.subject;
    }
    perStudent.set(m.studentId, cur);
  }
  const below = Array.from(perStudent.values())
    .map((x) => ({
      ...x,
      average: x.max > 0 ? (x.total / x.max) * 100 : 0
    }))
    .filter((x) => x.average < threshold)
    .sort((a, b) => a.average - b.average);

  const studentOptions = students.map((s) => ({
    id: s.id,
    label: [s.studentCode, s.fullName, [s.class?.name, s.section?.name].filter(Boolean).join(' - ')]
      .filter(Boolean)
      .join(' | ')
  }));

  const openFlags = openFlagCount;
  const totalPages = Math.max(1, Math.ceil(Math.max(flagTotal, assessmentTotal) / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display mb-1">المتابعة العلاجية</h1>
          <p className="text-sm text-muted">
            الطلاب الذين حصلوا على أقل من حد المعالجة ({threshold}%) في امتحان محدد
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand"
        >
          تعديل حد المعالجة
        </Link>
      </div>

      {exams.length > 0 && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted">الامتحان:</span>
          {exams.map((e) => (
            <Link
              key={e.id}
              href={`/exams/remedial?examId=${e.id}`}
              className={`text-sm px-3 py-1 rounded-sm border ${
                e.id === selectedExamId ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
              }`}
            >
              {e.name}
            </Link>
          ))}
        </div>
      )}

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة خطة علاجية يدويًا</h2>
          <RemedialFlagForm
            students={studentOptions}
            exams={exams.map((e) => ({ id: e.id, name: e.name }))}
            defaultStudentId={params.student}
          />
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">
          طلاب بحاجة للمعالجة — {selectedExam?.name ?? 'الامتحان الأحدث'} ({below.length})
        </h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">الفصل</th>
                <th className="px-4 py-2 font-medium">أضعف مادة</th>
                <th className="px-4 py-2 font-medium">المتوسط</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراء</th>}
              </tr>
            </thead>
            <tbody>
              {below.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-6 text-center text-muted">
                    لا يوجد طلاب دون حد المعالجة
                  </td>
                </tr>
              )}
              {below.map((b) => (
                <tr key={b.student.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {b.student.fullName}
                    <span className="text-xs text-muted block">{b.student.studentCode}</span>
                  </td>
                  <td className="px-4 py-2">
                    {[b.student.class?.name, b.student.section?.name].filter(Boolean).join(' - ') || '—'}
                  </td>
                  <td className="px-4 py-2">{b.worstSubject}</td>
                  <td className="px-4 py-2 font-medium text-red-600">{b.average.toFixed(1)}%</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <Link
                        href={`/exams/remedial?examId=${selectedExamId}&student=${b.student.id}&subject=${encodeURIComponent(b.worstSubject)}`}
                        className="text-xs text-brand hover:underline"
                      >
                        إضافة خطة
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">
          الخطط العلاجية — مفتوح {openFlags} من {flagTotal}
        </h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">المادة</th>
                <th className="px-4 py-2 font-medium">الامتحان</th>
                <th className="px-4 py-2 font-medium">السبب</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-6 text-center text-muted">
                    لا توجد خطط علاجية بعد
                  </td>
                </tr>
              )}
              {flags.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-2">{f.student.fullName}</td>
                  <td className="px-4 py-2">{f.subject}</td>
                  <td className="px-4 py-2">{f.exam?.name ?? '—'}</td>
                  <td className="px-4 py-2">{f.reason ?? '—'}</td>
                  <td className="px-4 py-2">
                    {f.status === 'open' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">مفتوحة</span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">تمت المعالجة</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{new Date(f.createdAt).toLocaleDateString('ar-EG')}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {f.status === 'open' && (
                          <form action={resolveRemedialFlag.bind(null, f.id)}>
                            <button type="submit" className="text-xs text-emerald-600 hover:underline">
                              تمت المعالجة
                            </button>
                          </form>
                        )}
                        <DeleteButton onDelete={deleteRemedialFlag.bind(null, f.id)} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">التقييمات التكوينية</h2>
        {canManage && <FormativeAssessmentForm students={studentOptions} />}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">المادة</th>
                <th className="px-4 py-2 font-medium">الدرجة</th>
                <th className="px-4 py-2 font-medium">النسبة</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-muted">
                    لا توجد تقييمات تكوينية بعد
                  </td>
                </tr>
              )}
              {assessments.map((a) => {
                const pct = Number(a.maxScore) > 0 ? (Number(a.score) / Number(a.maxScore)) * 100 : 0;
                return (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-2">{a.student.fullName}</td>
                    <td className="px-4 py-2">{a.subject}</td>
                    <td className="px-4 py-2">
                      {Number(a.score)} / {Number(a.maxScore)}
                    </td>
                    <td className={`px-4 py-2 font-medium ${pct >= threshold ? 'text-emerald-600' : 'text-red-600'}`}>
                      {pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2">{new Date(a.assessmentDate).toLocaleDateString('ar-EG')}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <DeleteButton onDelete={deleteFormativeAssessment.bind(null, a.id)} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
