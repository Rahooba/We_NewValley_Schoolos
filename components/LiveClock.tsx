'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

function format(now: Date) {
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  const time = `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  const date = `${WEEKDAYS[now.getDay()]}، ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  return { time, date };
}

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { time, date } = format(now ?? new Date());

  return (
    <div className="flex items-center gap-2 text-muted">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Clock size={15} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-ink">{now ? time : '--:--'}</p>
        <p className="text-xs">{date}</p>
      </div>
    </div>
  );
}
