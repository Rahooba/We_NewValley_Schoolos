import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getRemedialThresholdPercent } from '@/lib/exams/settings';
import { aggregateTierReport } from '@/lib/exams/tier-report';
import { FinalMarksForm } from '../FinalMarksForm';
import { FinalResultsReport } from '../FinalResultsReport';

export const dynamic = 'force-dynamic';

export default async function FinalResultsPage({
  params,
  searchParams
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ examId?: string }>;
}) {
  const [{ subjectId }, { examId: examIdParam }] = await Promise.all([params, searchParams]);
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('exams.manage');
  if (!permissions.includes('exams.view')) redirect('/dashboard/forbidden');

  const [subject, exams, allSubjects, remedialThreshold] = await Promise.all([
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.exam.findMany({ orderBy: { startDate: 'desc' } }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    getRemedialThresholdPercent()
  ]);
  if (!subject) notFound();

  const selectedExamId = exams.some((e) => e.id === examIdParam) ? examIdParam! : exams[0]?.id ?? null;
  const exam = selectedExamId ? exams.find((e) => e.id === selectedExamId)! : null;

  let marks: { studentId: string; subject: string; score: number; maxScore: number }[] = [];
  let students: { id: string; studentCode: string; fullName: string }[] = [];
  let tierData: ReturnType<typeof aggregateTierReport> = [];
  let scoresByStudent = new Map<string, number>();
  let subjectMaxInitial: number | null = null;

  if (exam) {
    const [marksRes, studentsRes] = await Promise.all([
      prisma.mark.findMany({
        where: { examId: exam.id },
        select: { studentId: true, subject: true, score: true, maxScore: true }
      }),
      exam.gradeLevel
        ? prisma.student.findMany({
            where: { status: 'ACTIVE', class: { level: exam.gradeLevel } },
            select: { id: true, studentCode: true, fullName: true },
            orderBy: { fullName: 'asc' }
          })
        : prisma.student.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, studentCode: true, fullName: true },
            orderBy: { fullName: 'asc' }
          })
    ]);

    marks = marksRes.map((m) => ({ ...m, score: Number(m.score), maxScore: Number(m.maxScore) }));
    students = studentsRes;
    tierData = aggregateTierReport(marks, remedialThreshold);

    const subjectMarks = marks.filter((m) => m.subject === subject.name);
    scoresByStudent = new Map(subjectMarks.map((m) => [m.studentId, m.score]));
    if (subjectMarks.length > 0) {
      subjectMaxInitial = Math.max(...subjectMarks.map((m) => m.maxScore));
    }
  }

  const examHref = (id: string) => `/exams/final-results/${subjectId}?examId=${id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/exams" className="text-xs text-brand hover:underline">
          ← كل الصفوف والامتحانات
        </Link>
        <h1 className="text-2xl font-display mt-1">النتائج النهائية (النسبة التحليلية)</h1>
        <p className="text-sm text-muted">
          إدخال نتائج الاختبار النهائي لكل مادة بدرجتها الكلية الخاصة — لا تُفترض درجة كلية موحدة
        </p>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted">الامتحان:</span>
        {exams.length === 0 && <span className="text-sm text-muted">لا توجد امتحانات بعد</span>}
        {exams.map((e) => (
          <Link
            key={e.id}
            href={examHref(e.id)}
            className={`text-sm px-3 py-1 rounded-sm border ${
              e.id === selectedExamId ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {e.name}
          </Link>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted">المادة:</span>
        {allSubjects.map((s) => (
          <Link
            key={s.id}
            href={`/exams/final-results/${s.id}?examId=${selectedExamId ?? ''}`}
            className={`text-sm px-3 py-1 rounded-sm border ${
              s.id === subject.id ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {exam ? (
        <>
          {canManage && (
            <FinalMarksForm
              examId={exam.id}
              subjectId={subject.id}
              subjectName={subject.name}
              maxScoreInitial={subjectMaxInitial}
              students={students}
              scoresByStudent={scoresByStudent}
            />
          )}

          <FinalResultsReport data={tierData} threshold={remedialThreshold} />
        </>
      ) : (
        <div className="card p-10 text-center text-muted text-sm">
          أنشئ امتحانًا من صفحة الامتحانات أولاً لإدخال النتائج النهائية
        </div>
      )}
    </div>
  );
}