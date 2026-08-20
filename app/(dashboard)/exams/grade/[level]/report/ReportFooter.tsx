const SIGNATORIES = [
  { title: 'مسؤول التقييم والامتحانات', name: 'أ. محمد أحمد علي' },
  { title: 'المشرف التنفيذي', name: 'أ. مصطفى ناصف أنيس' },
  { title: 'المدير الأكاديمي', name: 'أ. أيمن محمد حمدون' },
  { title: 'مشرف الوحدة', name: 'أنتصار علي عبد العال' }
];

export function ReportFooter() {
  return (
    <div className="mt-8 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
      {SIGNATORIES.map((s) => (
        <div key={s.title} className="text-xs">
          <p className="text-muted">{s.title}</p>
          <p className="font-medium mt-1">{s.name}</p>
        </div>
      ))}
    </div>
  );
}
