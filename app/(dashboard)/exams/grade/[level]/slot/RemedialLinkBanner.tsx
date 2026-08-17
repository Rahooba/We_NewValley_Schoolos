import Link from 'next/link';

// UI link only — the remedial list is computed from the student's AVERAGE across
// all assessments, not from this single assessment's tier, so this banner must
// never become part of the tier/remedial computation itself.
export function RemedialLinkBanner({ gradeLevel }: { gradeLevel: number }) {
  return (
    <div className="card p-4 border-brand/30 bg-brand/5 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-muted">
        الطالب الذي يحصل على <b>NI/UN</b> في هذا التقييم ليس بالضرورة تحسينيًا — التحسيني يُحسب من{' '}
        <b>المتوسط العام</b> للطالب في كل التقييمات مقارنة بحد المعالجة.
      </p>
      <Link
        href={`/exams/grade/${gradeLevel}`}
        className="text-xs text-brand border border-brand/40 rounded-sm px-3 py-1.5 hover:bg-brand hover:text-white transition-colors shrink-0"
      >
        عرض الطلاب التحسينيين في هذا الصف
      </Link>
    </div>
  );
}