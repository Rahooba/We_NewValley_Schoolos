import { GRADE_TIERS } from '@/lib/exams/grade-tier';
import type { SubjectTierReport } from '@/lib/exams/tier-report';

function fmt(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

function pct(count: number, total: number): string {
  return total > 0 ? fmt((count / total) * 100) : '—';
}

function ReportTable({ title, header, rows }: { title: string; header: string[]; rows: (string | number)[][] }) {
  return (
    <div className="card overflow-hidden">
      <h3 className="px-4 pt-3 pb-1 text-sm font-medium">{title}</h3>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              {header.map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className={`px-4 py-2 ${j === 0 ? 'font-medium' : ''}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// One component, three views of the same buildTierReport/aggregateTierReport
// output — never three separate computations.
export function FinalResultsReport({ data, threshold }: { data: SubjectTierReport[]; threshold: number }) {
  if (data.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-medium mb-3">تقرير النتيجة التحليلية</h2>
        <div className="card p-10 text-center text-muted text-sm">
          لا توجد درجات مُدخلة بعد — التقرير يظهر تلقائيًا بعد أول حفظ
        </div>
      </section>
    );
  }

  const subjectNames = data.map((s) => s.subjectName);

  const countRows = GRADE_TIERS.map((t) => [
    `${t.label} — ${t.tier} (${t.min}:${t.max})`,
    ...data.map((s) => s.tierCounts[t.tier])
  ]);
  const totalRow = ['الإجمالي', ...data.map((s) => s.totalStudents)];

  const sixtyFiveRows = [
    ['إجمالي الطلاب', ...data.map((s) => s.totalStudents)],
    [`عدد الطلاب ≥ ${threshold}%`, ...data.map((s) => s.totalStudents - s.remedialCount)],
    ['نسبة النجاح', ...data.map((s) => fmt(((s.totalStudents - s.remedialCount) / s.totalStudents) * 100))]
  ];

  const percentRows = GRADE_TIERS.map((t) => [
    `${t.label} — ${t.tier}`,
    ...data.map((s) => pct(s.tierCounts[t.tier], s.totalStudents))
  ]);
  const averageRows = [
    ['نسبة النجاح', ...data.map((s) => fmt(((s.totalStudents - s.remedialCount) / s.totalStudents) * 100))],
    ['المتوسط', ...data.map((s) => fmt(s.averagePercent))]
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">تقرير النتيجة التحليلية — نسبة النجاح من {threshold}%</h2>

      <ReportTable
        title="1) العدد التحليلي (EE/ME/NI/UN)"
        header={['التصنيف', ...subjectNames]}
        rows={[...countRows, totalRow]}
      />

      <ReportTable
        title={`2) إحصائية نسبة ${threshold}%`}
        header={['البند', ...subjectNames]}
        rows={sixtyFiveRows}
      />

      <ReportTable
        title="3) إحصائية النسب كنسب مئوية"
        header={['البند', ...subjectNames]}
        rows={[...percentRows, ...averageRows]}
      />
    </section>
  );
}