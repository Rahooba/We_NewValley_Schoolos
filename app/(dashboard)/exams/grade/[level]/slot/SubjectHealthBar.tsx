import type { SubjectHealth } from '@/lib/exams/subject-health';

const STATUS_STYLES: Record<SubjectHealth['status'], { chip: string; bar: string; label: string }> = {
  strong: { chip: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500', label: 'ممتاز' },
  watch: { chip: 'text-amber-700 bg-amber-50 border-amber-200', bar: 'bg-amber-500', label: 'متابعة' },
  weak: { chip: 'text-red-700 bg-red-50 border-red-200', bar: 'bg-red-500', label: 'تحسيني' }
};

export function SubjectHealthBar({ data, threshold }: { data: SubjectHealth[]; threshold: number }) {
  if (data.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-medium mb-3">ملخص الأداء</h2>
        <div className="card p-10 text-center text-muted text-sm">
          لا توجد درجات بعد — أدخل الدرجات ليظهر ملخص الأداء لكل مادة
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-medium mb-3">ملخص الأداء (نسبة النجاح ≥ {threshold}%)</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((s) => {
          const style = STATUS_STYLES[s.status];
          const rounded = Math.round(s.passRatePercent * 10) / 10;
          return (
            <div key={s.subjectId} className="card p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-medium">{s.subjectName}</p>
                <span className={`text-xs rounded-full border px-2 py-0.5 ${style.chip}`}>
                  {rounded}% — {style.label}
                </span>
              </div>
              <div className="h-2 rounded-full bg-paper overflow-hidden">
                <div
                  className={`h-full rounded-full ${style.bar}`}
                  style={{ width: `${Math.min(100, Math.max(0, s.passRatePercent))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}