'use client';

import { saveCleanliness } from './actions';

export function CleanlinessCell({
  weekDate,
  className,
  value,
  canManage
}: {
  weekDate: string;
  className: string;
  value?: number;
  canManage: boolean;
}) {
  if (!canManage) {
    return (
      <span className={value === undefined ? 'text-muted' : 'font-medium'}>
        {value === undefined ? '—' : value}
      </span>
    );
  }
  return (
    <form action={saveCleanliness} onChange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="weekDate" value={weekDate} />
      <input type="hidden" name="className" value={className} />
      <select name="score" defaultValue={value === undefined ? '' : String(value)} className="input-field text-xs w-16 py-1 text-center">
        <option value="">—</option>
        {Array.from({ length: 11 }, (_, i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
    </form>
  );
}
