import { GRADE_TIERS } from '@/lib/exams/grade-tier';
import type { SubjectTierReport } from '@/lib/exams/tier-report';

const TIER_COLORS: Record<string, string> = {
  EE: 'text-emerald-700 bg-emerald-50',
  ME: 'text-sky-700 bg-sky-50',
  NI: 'text-amber-700 bg-amber-50',
  UN: 'text-red-700 bg-red-50'
};

export function TierReportTable({ data }: { data: SubjectTierReport[] }) {
  if (data.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-medium mb-3">تقرير تصنيف الدرجات (EE/ME/NI/UN)</h2>
        <div className="card p-10 text-center text-muted text-sm">
          لا توجد درجات مُدخلة لهذا التقييم بعد — التقرير يظهر تلقائيًا بعد أول حفظ
        </div>
      </section>
    );
  }

  const totalStudents = (r: SubjectTierReport) =>
    Object.values(r.tierCounts).reduce((sum, n) => sum + n, 0);

  return (
    <section>
      <h2 className="text-lg font-medium mb-3">تقرير تصنيف الدرجات (EE/ME/NI/UN)</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">التصنيف</th>
                {data.map((s) => (
                  <th key={s.subjectId} className="px-4 py-2 font-medium">
                    {s.subjectName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADE_TIERS.map((t) => (
                <tr key={t.tier} className="border-t border-border">
                  <td className="px-4 py-2">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${TIER_COLORS[t.tier]}`}>
                      {t.label} — {t.tier} ({t.min}:{t.max})
                    </span>
                  </td>
                  {data.map((s) => (
                    <td key={s.subjectId} className="px-4 py-2 font-medium">
                      {s.tierCounts[t.tier]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border bg-paper/50">
                <td className="px-4 py-2 font-medium">الإجمالي</td>
                {data.map((s) => (
                  <td key={s.subjectId} className="px-4 py-2 font-medium">
                    {totalStudents(s)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}