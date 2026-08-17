'use client';

import Link from 'next/link';
import type { SpecializationGroup } from '@/lib/exams/specialization-report';

export function SpecializationTabs({
  groups,
  activeClassName,
  baseUrl
}: {
  groups: SpecializationGroup[];
  activeClassName: string;
  baseUrl: string;
}) {
  return (
    <div className="card p-2 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted px-2">التخصص:</span>
      {groups.map((g) => (
        <Link
          key={g.className}
          href={`${baseUrl}?spec=${encodeURIComponent(g.className)}`}
          className={`text-sm px-3 py-1 rounded-sm border transition-colors ${
            g.className === activeClassName
              ? 'bg-brand text-white border-brand'
              : 'border-border hover:border-brand'
          }`}
        >
          {g.className}
          <span className="text-xs opacity-70 mr-1">({g.totalStudents})</span>
        </Link>
      ))}
    </div>
  );
}
