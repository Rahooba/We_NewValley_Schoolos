import Link from 'next/link';
import { Plus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PermissionGate } from '@/components/PermissionGate';
import { GRADE_LABELS, SLOTS_BY_LEVEL, GROUP_LABELS } from '@/lib/examSlots';
import { DeleteButton } from '@/components/DeleteButton';
import { deleteExam } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function GradeExamsPage({
  params
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: raw } = await params;
  const level = Number(raw);
  if (![1, 2, 3].includes(level)) notFound();

  const slots = SLOTS_BY_LEVEL[level];
  const groups = Array.from(new Set(slots.map((s) => s.group)));

  const [grade, exams, students, assessments, remedialSetting, enrichmentSetting] = await Promise.all([
    prisma.class.findMany({ where: { level }, orderBy: { name: 'asc' } }),
    prisma.exam.findMany({ where: { gradeLevel: level }, orderBy: { startDate: 'desc' } }),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true }
    }),
    prisma.formativeAssessment.findMany({
      where: { gradeLevel: level },
      include: { student: { include: { class: true, section: true } } }
    }),
    prisma.setting.findUnique({ where: { key: 'remedial_threshold_percent' } }),
    prisma.setting.findUnique({ where: { key: 'enrichment_threshold_percent' } })
  ]);

const remedialThreshold = Number(remedialSetting?.value ?? '65');
const enrichmentThreshold = Number(enrichmentSetting?.value ?? '90');

// طلاب هذا الصف فقط (الفصل قد يكون بلا مستوى في بيانات قديمة)
const gradeStudents = students.filter((s) => s.class?.level === level);

// تحليل درجات الطلاب: متوسط كل طالب عبر شرائح الصف
const perStudent = new Map<string, { total: number; max: number }>();
for (const a of assessments) {
  const cur = perStudent.get(a.studentId) ?? { total: 0, max: 0 };
  cur.total += Number(a.score);
  cur.max += Number(a.maxScore);
  perStudent.set(a.studentId, cur);
}
const analysis = gradeStudents.map((s) => {
    const agg = perStudent.get(s.id) ?? { total: 0, max: 0 };
    const average = agg.max > 0 ? (agg.total / agg.max) * 100 : null;
    let flag: 'remedial' | 'enrichment' | null = null;
    if (average !== null) {
      if (average < remedialThreshold) flag = 'remedial';
      else if (average >= enrichmentThreshold) flag = 'enrichment';
    }
    return { student: s, average, flag };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/exams" className="text-xs text-brand hover:underline">
            ← كل الصفوف
          </Link>
          <h1 className="text-2xl font-display mt-1">{GRADE_LABELS[level]}</h1>
          <p className="text-sm text-muted">
            الفصول: {grade.map((c) => c.name).join('، ') || '—'} — حد المعالجة {remedialThreshold}% / حد الإثراء{' '}
            {enrichmentThreshold}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/exams/grade/${level}/report`} className="btn-secondary text-sm">
            التقرير التحليلي
          </Link>
          <PermissionGate permission="exams.manage">
            <Link href={`/exams/new?gradeLevel=${level}`} className="btn-primary">
              <Plus size={16} />
              امتحان فصل دراسي جديد
            </Link>
          </PermissionGate>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g}>
          <h2 className="text-lg font-medium mb-3">{GROUP_LABELS[g]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {slots
              .filter((s) => s.group === g)
              .map((slot) => {
                const entered = assessments.filter((a) => a.slot === slot.key).length;
                const studentCount = students.length;
                return (
                  <Link
                    key={slot.key}
                    href={`/exams/grade/${level}/slot?slot=${slot.key}`}
                    className="card p-4 hover:border-brand transition-colors block"
                  >
                    <h3 className="font-medium mb-1">{slot.label}</h3>
                    <p className="text-xs text-muted">
                      {entered} / {studentCount} طالب تم إدخالهم
                    </p>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-lg font-medium mb-3">امتحانات الفصل الدراسي — {exams.length}</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الامتحان</th>
                <th className="px-4 py-2 font-medium">من</th>
                <th className="px-4 py-2 font-medium">إلى</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    لا توجد امتحانات فصلية لهذا الصف بعد
                  </td>
                </tr>
              )}
              {exams.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    <Link href={`/exams/${e.id}`} className="hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{new Date(e.startDate).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2 text-muted">{new Date(e.endDate).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2 text-left">
                    <DeleteButton onDelete={deleteExam.bind(null, e.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">تحليل درجات الطلاب</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">الفصل</th>
                <th className="px-4 py-2 font-medium">المتوسط %</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {analysis.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    لا يوجد طلاب في هذا الصف
                  </td>
                </tr>
              )}
              {analysis.map(({ student, average, flag }) => (
                <tr key={student.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">
                    {student.fullName}
                    <span className="text-xs text-muted block">{student.studentCode}</span>
                  </td>
                  <td className="px-4 py-2 text-muted">{student.section?.name ?? '—'}</td>
                  <td className="px-4 py-2 font-medium">{average === null ? '—' : `${average.toFixed(1)}%`}</td>
                  <td className="px-4 py-2">
                    {flag === 'remedial' && (
                      <span className="text-xs bg-red-50 text-red-700 rounded-full px-2 py-0.5">تحسيني</span>
                    )}
                    {flag === 'enrichment' && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">إثرائي</span>
                    )}
                    {flag === null && <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}