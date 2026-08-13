import Link from 'next/link';

type PaginationProps = {
  page: number;
  totalPages: number;
  searchParams?: Record<string, string | string[] | undefined>;
  base?: string;
  paramName?: string;
};

function buildHref(
  target: number,
  paramName: string,
  searchParams: Record<string, string | string[] | undefined>,
  base: string
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || key === paramName) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.append(key, value);
  }
  params.set(paramName, String(target));
  const qs = params.toString();
  return `${base}${qs ? `?${qs}` : ''}`;
}

function pageItems(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: (number | '…')[] = [1];
  if (page > 3) items.push('…');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) items.push(p);
  if (page < totalPages - 2) items.push('…');
  items.push(totalPages);
  return items;
}

export default function Pagination({
  page,
  totalPages,
  searchParams = {},
  base = '',
  paramName = 'page'
}: PaginationProps) {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), total);
  if (total <= 1) return null;

  const itemClass =
    'inline-flex items-center justify-center min-w-9 h-9 px-3 text-sm rounded-md border transition-colors';
  const linkClass = `${itemClass} border-border bg-surface hover:border-brand hover:text-brand`;
  const activeClass = `${itemClass} border-brand bg-brand text-white`;
  const disabledClass = `${itemClass} border-border bg-paper text-muted opacity-50 pointer-events-none`;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 mt-5" aria-label="ترقيم الصفحات">
      {current > 1 ? (
        <Link
          href={buildHref(current - 1, paramName, searchParams, base)}
          className={linkClass}
          prefetch={false}
        >
          السابق
        </Link>
      ) : (
        <span className={disabledClass}>السابق</span>
      )}

      <span className="text-xs text-muted px-1">
        {current} / {total}
      </span>

      {pageItems(current, total).map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : p === current ? (
          <span key={p} className={activeClass}>
            {p}
          </span>
        ) : (
          <Link key={p} href={buildHref(p, paramName, searchParams, base)} className={linkClass} prefetch={false}>
            {p}
          </Link>
        )
      )}

      {current < total ? (
        <Link
          href={buildHref(current + 1, paramName, searchParams, base)}
          className={linkClass}
          prefetch={false}
        >
          التالي
        </Link>
      ) : (
        <span className={disabledClass}>التالي</span>
      )}
    </nav>
  );
}