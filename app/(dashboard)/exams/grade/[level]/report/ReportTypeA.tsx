import { GRADE_TIERS } from '@/lib/exams/grade-tier';
import type { SubjectTierReport } from '@/lib/exams/tier-report';
import type { SpecializationGroup } from '@/lib/exams/specialization-report';

function fmt(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

function pct(count: number, total: number): string {
  return total > 0 ? fmt((count / total) * 100) : '—';
}

function ReportTable({
  title,
  headers,
  rows,
  highlightLastRow
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  highlightLastRow?: boolean;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold mb-2 text-center">{title}</h3>
      <div className="overflow-x-auto border border-black">
        <table className="w-full text-xs min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-gray-200">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-2 py-1.5 border border-black font-bold text-center whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={ri}
                className={highlightLastRow && ri === rows.length - 1 ? 'bg-gray-100 font-bold' : ''}
              >
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className={`px-2 py-1.5 border border-black text-center ${
                      ci === 0 ? 'font-bold bg-gray-50' : ''
                    }`}
                  >
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

export function ReportTypeA({
  group,
  gradeLevel,
  remedialThreshold
}: {
  group: SpecializationGroup;
  gradeLevel: number;
  remedialThreshold: number;
}) {
  const { className, totalStudents, tierReport, scoreBands, totalTierRow, totalScoreBand } = group;
  const subjects = tierReport.map((s) => s.subjectName);
  const allSubjectNames = [...subjects, 'المجموع'];

  // Table 1: Raw tier counts
  const tierRows = GRADE_TIERS.map((t) => [
    `${t.label} (${t.min}:${t.max})`,
    ...tierReport.map((s) => s.tierCounts[t.tier]),
    totalTierRow.tierCounts[t.tier]
  ]);
  const totalRow: (string | number)[] = [
    'الإجمالي',
    ...tierReport.map((s) => s.totalStudents),
    totalTierRow.totalStudents
  ];

  // Table 2: 65% threshold stats
  const sixtyFiveRows: (string | number)[][] = [
    [
      'اجمالي عدد الطلاب',
      ...tierReport.map((s) => s.totalStudents),
      totalTierRow.totalStudents
    ],
    [
      `عدد الطلاب الحاصلين على ${remedialThreshold}% واكثر`,
      ...tierReport.map((s) => s.totalStudents - s.remedialCount),
      totalTierRow.totalStudents - totalTierRow.remedialCount
    ],
    [
      `نسبة ${remedialThreshold}%`,
      ...tierReport.map((s) => pct(s.totalStudents - s.remedialCount, s.totalStudents)),
      pct(totalTierRow.totalStudents - totalTierRow.remedialCount, totalTierRow.totalStudents)
    ]
  ];

  // Table 3: Percentage distribution
  const percentRows = GRADE_TIERS.map((t) => [
    `${t.label} (${t.min}:${t.max})`,
    ...tierReport.map((s) => pct(s.tierCounts[t.tier], s.totalStudents)),
    pct(totalTierRow.tierCounts[t.tier], totalTierRow.totalStudents)
  ]);

  const titleSuffix = className === 'جميع التخصصات' ? 'جميع التخصصات' : `تخصص ${className}`;
  const gradeLabel = gradeLevel === 1 ? 'الأول' : gradeLevel === 2 ? 'الثاني' : 'الثالث';

  return (
    <div className="space-y-6">
      <ReportTable
        title={`النسبة التحليلية العامة للصف ${gradeLabel} للعام الدراسي 2025 / 2026 ${titleSuffix}`}
        headers={['التصنيف', ...allSubjectNames]}
        rows={[...tierRows, totalRow]}
      />

      <ReportTable
        title={`احصائية نسبة ${remedialThreshold}% الصف ${gradeLabel} ${titleSuffix}`}
        headers={['البند', ...allSubjectNames]}
        rows={sixtyFiveRows}
      />

      <ReportTable
        title={`احصائية النسبة للنتيجة 2025 / 2026 الصف ${gradeLabel} ${titleSuffix}`}
        headers={['البند', ...allSubjectNames]}
        rows={percentRows}
        highlightLastRow
      />
    </div>
  );
}
