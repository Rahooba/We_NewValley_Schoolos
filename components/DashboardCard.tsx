import Link from 'next/link';
import type { ReactNode } from 'react';

export function DashboardCard({
  title,
  icon,
  value,
  subtitle,
  detailHref,
  detailLabel = 'التفاصيل',
  items,
  emptyText
}: {
  title: string;
  icon?: ReactNode;
  value: ReactNode;
  subtitle?: string;
  detailHref?: string;
  detailLabel?: string;
  items?: { label: string; sub?: string; badge?: { text: string; tone: 'high' | 'medium' | 'low' } }[];
  emptyText?: string;
}) {
  const tones: Record<string, string> = {
    high: 'bg-red-50 text-red-700',
    medium: 'bg-amber-50 text-amber-700',
    low: 'bg-emerald-50 text-emerald-700'
  };

  return (
    <div className="card p-5 flex flex-col transition-shadow hover:shadow-[0_10px_28px_-10px_rgba(91,42,140,0.25)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted text-sm">{title}</p>
        {icon && <span className="text-brand">{icon}</span>}
      </div>
      <p className="text-3xl font-display font-extrabold text-brand-dark">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}

      {items && (
        <ul className="mt-3 space-y-2 flex-1">
          {items.length === 0 && emptyText && <li className="text-xs text-muted">{emptyText}</li>}
          {items.map((it, i) => (
            <li key={i} className="text-sm flex items-start justify-between gap-2">
              <div>
                <p>{it.label}</p>
                {it.sub && <p className="text-xs text-muted">{it.sub}</p>}
              </div>
              {it.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tones[it.badge.tone]}`}>
                  {it.badge.text}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {detailHref && (
        <Link href={detailHref} className="text-xs text-brand hover:underline mt-3 inline-block">
          {detailLabel} ←
        </Link>
      )}
    </div>
  );
}
