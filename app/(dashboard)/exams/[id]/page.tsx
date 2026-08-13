import { notFound } from 'next/navigation';
import { Calculator } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { MarkRow } from './MarkRow';
import { CommitteesPanel } from './CommitteesPanel';
import { computeResults } from '../actions';

const PAGE_SIZE = 25;

export default async function ExamMarksPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string; page?: string }>;
}) {
  const [{ id }, { subject: subjectParam, page: pageParam }] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(pageParam) || 1);
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('exams.manage');

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      committees: { orderBy: { room: 'asc' } },
      results: { orderBy: { average: 'desc' } }
    }
  });
  if (!exam) notFound();

  const [subjects, students, studentTotal, marks] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.mark.findMany({ where: { examId: id } })
  ]);
  const totalPages = Math.max(1, Math.ceil(studentTotal / PAGE_SIZE));

  const subjectName = subjectParam || subjects[0]?.name || '';
  const markMap = new Map(marks.filter((m) => m.subject === subjectName).map((m) => [m.studentId, m]));

  const resultStudents = await prisma.student.findMany({
    where: { id: { in: exam.results.map((r) => r.studentId) } },
    select: { id: true, fullName: true }
  });
  const studentNames = new Map(resultStudents.map((s) => [s.id, s.fullName]));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display">{exam.name}</h1>
        {canManage && (
          <form action={computeResults.bind(null, exam.id)}>
            <button type="submit" className="btn-primary">
              <Calculator size={16} />
              حساب النتائج
            </button>
          </form>
        )}
      </div>
      <p className="text-sm text-muted mb-6">إدخال درجات الطلاب لكل مادة</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {subjects.map((s) => (
          <a
            key={s.id}
            href={`/exams/${exam.id}?subject=${encodeURIComponent(s.name)}`}
            className={`text-sm px-3 py-1.5 rounded-sm border ${
              s.name === subjectName ? 'bg-brand text-white border-brand' : 'border-border'
            }`}
          >
            {s.name}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الطالب</th>
              <th className="px-4 py-3 font-medium">الدرجة ({subjectName || '—'})</th>
              {canManage && <th className="px-4 py-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={canManage ? 3 : 2} className="px-4 py-10 text-center text-muted">
                  لا يوجد طلاب مسجلون بعد
                </td>
              </tr>
            )}
            {subjectName &&
              students.map((st) => {
                const m = markMap.get(st.id);
                return (
                  <MarkRow
                    key={st.id}
                    examId={exam.id}
                    studentId={st.id}
                    studentName={st.fullName}
                    subject={subjectName}
                    score={m ? Number(m.score) : undefined}
                    maxScore={m ? Number(m.maxScore) : undefined}
                    markId={m?.id}
                  />
                );
              })}
          </tbody>
        </table>
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={{ subject: subjectParam, page: pageParam }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <CommitteesPanel examId={exam.id} committees={exam.committees} />

        <div className="card p-4">
          <h2 className="font-medium mb-3">النتائج</h2>
          <p className="text-xs text-muted mb-3">
            اضغط «حساب النتائج» أعلاه لإعادة احتساب المجموع والمعدل ونتيجة النجاح لكل طالب.
          </p>
          {exam.results.length > 0 ? (
            <div className="space-y-1 text-sm max-h-72 overflow-y-auto">
              {exam.results.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b border-border py-1">
                  <span>{studentNames.get(r.studentId) ?? r.studentId}</span>
                  <span className="text-muted">
                    المجموع {Number(r.total)} — المعدل {Number(r.average).toFixed(2)}%
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {r.status === 'pass' ? 'ناجح' : 'راسب'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">لا توجد نتائج محسوبة بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
