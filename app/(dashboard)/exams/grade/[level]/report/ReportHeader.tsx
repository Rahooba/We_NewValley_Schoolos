export function ReportHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-right text-xs leading-relaxed text-muted">
          <p>وزارة التربية والتعليم والتعليم الفني</p>
          <p>الإدارة المركزية لتطوير التعليم الفني</p>
          <p>وحدة تشغيل وإدارة مدارس التكنولوجيا التطبيقية</p>
          <p className="font-medium">مدرسة WE الثانوية المشتركة للتكنولوجيا التطبيقية بالوادي الجديد</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-[10px] text-[8px] text-muted border">
            وزارة
          </div>
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-[8px] text-muted border">
            تطبيقي
          </div>
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-[8px] text-muted border">
            WE
          </div>
        </div>
      </div>
      <h1 className="text-lg font-bold text-center">{title}</h1>
      {subtitle && <p className="text-sm text-center text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
