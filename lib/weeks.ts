// ISO 8601 week helpers (shared by server pages and client components).

export function isoWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  return d.getUTCFullYear();
}

export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  return 1 + Math.round((d.getTime() - jan4Monday.getTime()) / (7 * 86400000));
}

export function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const jan4Monday = new Date(jan4);
  jan4Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const monday = new Date(jan4Monday);
  monday.setUTCDate(jan4Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function sundayOfIsoWeek(year: number, week: number): Date {
  const monday = mondayOfIsoWeek(year, week);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function weekOfISO(date: Date): string {
  return `${isoWeekYear(date)}-W${String(isoWeek(date)).padStart(2, '0')}`;
}

export type WeekInfo = {
  year: number;
  week: number;
  mondayISO: string;
  label: string;
  rangeLabel: string;
};

export function weeksRange(fromOffset: number, toOffset: number, now = new Date()): WeekInfo[] {
  const currentYear = isoWeekYear(now);
  const currentWeek = isoWeek(now);
  const result: WeekInfo[] = [];
  for (let offset = fromOffset; offset <= toOffset; offset++) {
    const monday = new Date(
      mondayOfIsoWeek(currentYear, currentWeek).getTime() + offset * 7 * 86400000
    );
    const y = isoWeekYear(monday);
    const w = isoWeek(monday);
    const sun = sundayOfIsoWeek(y, w);
    result.push({
      year: y,
      week: w,
      mondayISO: toISODate(monday),
      label: `أسبوع ${w}`,
      rangeLabel: `${toISODate(monday)} / ${toISODate(sun)}`
    });
  }
  return result;
}
