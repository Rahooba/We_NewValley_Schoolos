type TableSkeletonProps = {
  rows?: number;
  cols?: number;
  header?: boolean;
  heading?: boolean;
  className?: string;
};

const COL_WIDTHS = [30, 55, 40, 35, 45, 50, 30, 60];

export default function TableSkeleton({
  rows = 6,
  cols = 5,
  header = true,
  heading = true,
  className = ''
}: TableSkeletonProps) {
  return (
    <div className={`space-y-5 ${className}`} aria-hidden>
      {heading && <div className="h-8 w-52 rounded-lg bg-border/70 animate-pulse" />}

      <div className="card overflow-hidden">
        {header && (
          <div className="flex items-center gap-4 border-b border-border bg-paper px-4 py-3">
            {Array.from({ length: cols }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="h-3.5 rounded bg-border/80 animate-pulse"
                style={{ width: `${COL_WIDTHS[i % COL_WIDTHS.length] * 0.6}%` }}
              />
            ))}
          </div>
        )}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              {Array.from({ length: cols }).map((_, c) => (
                <div
                  key={`c-${c}`}
                  className="h-3.5 rounded bg-border/70 animate-pulse"
                  style={{ width: `${COL_WIDTHS[(r + c) % COL_WIDTHS.length]}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}