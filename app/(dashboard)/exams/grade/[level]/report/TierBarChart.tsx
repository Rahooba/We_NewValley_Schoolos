import { GRADE_TIERS } from '@/lib/exams/grade-tier';
import type { SubjectTierReport } from '@/lib/exams/tier-report';

const BAR_COLORS: Record<string, string> = {
  EE: 'bg-yellow-500',
  ME: 'bg-red-700',
  NI: 'bg-green-600',
  UN: 'bg-purple-700'
};

const BAR_LABELS: Record<string, string> = {
  EE: 'ممتاز (80:100)',
  ME: 'جيد جداً (50:79.9)',
  NI: 'يحتاج تحسين (30:49.9)',
  UN: 'غير مرضٍ (0:29.9)'
};

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

export function TierBarChart({ data }: { data: SubjectTierReport[] }) {
  if (data.length === 0) return null;

  const subjects = data.map((s) => s.subjectName);
  const maxPercent = 100;

  return (
    <section>
      <div className="card p-4 overflow-x-auto">
        {/* Chart area */}
        <div className="min-w-[600px]">
          {/* Y-axis labels + bars */}
          <div className="flex gap-1">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-[10px] text-muted pr-1 pb-6" style={{ height: 260 }}>
              {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((v) => (
                <span key={v}>{v}%</span>
              ))}
            </div>

            {/* Bars container */}
            <div className="flex-1 relative">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6" style={{ height: 260 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div key={i} className="border-b border-border/40 w-full" />
                ))}
              </div>

              {/* Bars */}
              <div className="flex items-end justify-around relative" style={{ height: 260 }}>
                {data.map((subject) => {
                  const total = subject.totalStudents;
                  return (
                    <div key={subject.subjectId} className="flex flex-col items-center flex-1">
                      <div className="flex items-end gap-[2px] h-full">
                        {GRADE_TIERS.map((tier) => {
                          const value = pct(subject.tierCounts[tier.tier], total);
                          const height = (value / maxPercent) * 260;
                          return (
                            <div key={tier.tier} className="flex flex-col items-center">
                              {value > 0 && (
                                <span className="text-[9px] text-muted mb-0.5">{value}%</span>
                              )}
                              <div
                                className={`w-4 sm:w-5 ${BAR_COLORS[tier.tier]} rounded-t-sm`}
                                style={{ height: Math.max(height, value > 0 ? 2 : 0) }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex justify-around border-t border-border pt-1 mt-0">
                {data.map((subject) => (
                  <div key={subject.subjectId} className="flex-1 text-center text-[10px] text-muted px-0.5 leading-tight">
                    {subject.subjectName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {GRADE_TIERS.map((tier) => (
              <div key={tier.tier} className="flex items-center gap-1.5 text-xs">
                <div className={`w-3 h-3 ${BAR_COLORS[tier.tier]} rounded-sm`} />
                <span>{BAR_LABELS[tier.tier]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data table below chart */}
      <div className="card overflow-hidden mt-3">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs min-w-[480px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-3 py-1.5 font-medium">التصنيف</th>
                {subjects.map((s) => (
                  <th key={s} className="px-3 py-1.5 font-medium">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADE_TIERS.map((t) => (
                <tr key={t.tier} className="border-t border-border">
                  <td className="px-3 py-1.5 font-medium">{t.label}</td>
                  {data.map((s) => (
                    <td key={s.subjectId} className="px-3 py-1.5 text-center">
                      {pct(s.tierCounts[t.tier], s.totalStudents)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
