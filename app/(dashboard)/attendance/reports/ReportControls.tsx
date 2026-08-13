'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type Mode = 'day' | 'week' | 'month';

export function ReportControls({
  mode,
  date
}: {
  mode: Mode;
  date: string;
}) {
  const router = useRouter();
  const modeRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const m = modeRef.current?.value ?? 'day';
    let d = dateRef.current?.value ?? date;
    if (m === 'month' && d && d.length === 10) d = d.slice(0, 7);
    const params = new URLSearchParams();
    if (m !== 'day') params.set('mode', m);
    if (d) params.set('date', d);
    router.push(`/attendance/reports?${params.toString()}`);
  };

  return (
    <div className="card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-muted mb-1">نوع التقرير</label>
        <select ref={modeRef} defaultValue={mode} className="input-field text-sm" onChange={submit}>
          <option value="day">يومي</option>
          <option value="week">أسبوعي</option>
          <option value="month">شهري</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">
          {mode === 'month' ? 'الشهر' : 'التاريخ'}
        </label>
        <input
          ref={dateRef}
          type={mode === 'month' ? 'month' : 'date'}
          defaultValue={date}
          className="input-field text-sm"
          onChange={submit}
        />
      </div>
    </div>
  );
}
