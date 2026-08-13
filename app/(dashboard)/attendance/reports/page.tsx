import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReportControls } from './ReportControls';
import type { AttendanceStatus } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseLocalDate(value: string): Date {
  const parts = value.split('-').map(Number);
  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
  if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
  return new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isAbsent(status: AttendanceStatus | undefined): boolean {
  return status === 'ABSENT' || status === 'EXCUSED';
}

type Row = { label: string; marked: number; absent: number; present: number; absentPct: number };

function summarize(rows: Row[]) {
  const marked = rows.reduce((s, r) => s + r.marked, 0);
  const absent = rows.reduce((s, r) => s + r.absent, 0);
  return { marked, absent, present: marked - absent, absentPct: marked > 0 ? (absent / marked) * 100 : 0 };
}

async function computeDay(day: Date) {
  const from = startOfDay(day);
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  const records = await prisma.studentAttendance.findMany({
    where: { date: { gte: from, lt: to } },
    include: { student: { include: { class: true, section: true } } }
  });

  const byClass = new Map<string, Row>();
  for (const r of records) {
    const label = [r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || 'بدون فصل';
    const row = byClass.get(label) ?? { label, marked: 0, absent: 0, present: 0, absentPct: 0 };
    row.marked += 1;
    if (isAbsent(r.status)) row.absent += 1;
    byClass.set(label, row);
  }
  const rows = Array.from(byClass.values()).map((r) => ({ ...r, absentPct: r.marked ? (r.absent / r.marked) * 100 : 0 }));
  rows.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
  return { rows, totals: summarize(rows) };
}

async function computeWeek(day: Date) {
  const weekday = day.getDay();
  const mondayOffset = (weekday + 6) % 7;
  const monday = new Date(day.getFullYear(), day.getMonth(), day.getDate() - mondayOffset);

  const from = startOfDay(monday);
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
  const records = await prisma.studentAttendance.findMany({
    where: { date: { gte: from, lt: to } },
    include: { student: { include: { class: true, section: true } } }
  });

  const dayLabels = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
  const rows: Row[] = dayLabels.map((label) => ({ label, marked: 0, absent: 0, present: 0, absentPct: 0 }));

  for (const r of records) {
    const d = r.date;
    const diff = Math.round((startOfDay(d).getTime() - from.getTime()) / 86400000);
    const idx = Math.min(Math.max(diff, 0), 6);
    const row = rows[idx];
    row.marked += 1;
    if (isAbsent(r.status)) row.absent += 1;
  }
  rows.forEach((r) => (r.absentPct = r.marked ? (r.absent / r.marked) * 100 : 0));

  const byClass = new Map<string, Row>();
  for (const r of records) {
    const label = [r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || 'بدون فصل';
    const row = byClass.get(label) ?? { label, marked: 0, absent: 0, present: 0, absentPct: 0 };
    row.marked += 1;
    if (isAbsent(r.status)) row.absent += 1;
    byClass.set(label, row);
  }
  const classRows = Array.from(byClass.values())
    .map((r) => ({ ...r, absentPct: r.marked ? (r.absent / r.marked) * 100 : 0 }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ar'));

  return { dayRows: rows, classRows, totals: summarize(classRows) };
}

async function computeMonth(monthStart: Date) {
  const from = startOfDay(monthStart);
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  const records = await prisma.studentAttendance.findMany({
    where: { date: { gte: from, lt: to } },
    include: { student: { include: { class: true, section: true } } }
  });

  const byDay = new Map<string, Row>();
  const byClass = new Map<string, Row>();
  for (const r of records) {
    const dayLabel = new Date(r.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
    const row = byDay.get(dayLabel) ?? { label: dayLabel, marked: 0, absent: 0, present: 0, absentPct: 0 };
    row.marked += 1;
    if (isAbsent(r.status)) row.absent += 1;
    byDay.set(dayLabel, row);

    const cls = [r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || 'بدون فصل';
    const crow = byClass.get(cls) ?? { label: cls, marked: 0, absent: 0, present: 0, absentPct: 0 };
    crow.marked += 1;
    if (isAbsent(r.status)) crow.absent += 1;
    byClass.set(cls, crow);
  }

  const dayRows = Array.from(byDay.values()).map((r) => ({
    ...r,
    absentPct: r.marked ? (r.absent / r.marked) * 100 : 0
  }));
  const classRows = Array.from(byClass.values())
    .map((r) => ({ ...r, absentPct: r.marked ? (r.absent / r.marked) * 100 : 0 }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ar'));

  return { dayRows, classRows, totals: summarize(classRows) };
}

export default async function AttendanceReportsPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; date?: string }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('attendance.reports.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const mode = (['day', 'week', 'month'].includes(params.mode ?? '') ? params.mode : 'day') as
    | 'day'
    | 'week'
    | 'month';

  const todayISO = toLocalISO(new Date());
  const dateValue =
    params.date && params.date.length >= 10
      ? params.date
      : params.date && params.date.length === 7
        ? `${params.date}-01`
        : todayISO;
  const baseDate = parseLocalDate(dateValue);

  const day = await computeDay(baseDate);
  const week = await computeWeek(baseDate);
  const month = await computeMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));

  const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });

  const pct = (v: number) => `${v.toFixed(1)}%`;
  const tone = (v: number) =>
    v >= 20 ? 'text-red-600' : v >= 10 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">تقارير نسبة الحضور والغياب</h1>
        <p className="text-sm text-muted">نسبة الغياب اليومية والأسبوعية والشهرية للطلاب</p>
      </div>

      <ReportControls mode={mode} date={mode === 'month' ? dateValue.slice(0, 7) : dateValue} />

      {mode === 'day' && (
        <section className="card p-4">
          <h2 className="text-lg font-medium mb-3">
            تقرير يومي — {new Date(baseDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الفصل</th>
                <th className="px-4 py-2 font-medium">المُسجَّل</th>
                <th className="px-4 py-2 font-medium">حاضر</th>
                <th className="px-4 py-2 font-medium">غائب</th>
                <th className="px-4 py-2 font-medium">نسبة الغياب</th>
              </tr>
            </thead>
            <tbody>
              {day.rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-4 py-2">{r.label}</td>
                  <td className="px-4 py-2">{r.marked}</td>
                  <td className="px-4 py-2">{r.present}</td>
                  <td className="px-4 py-2">{r.absent}</td>
                  <td className={`px-4 py-2 font-medium ${tone(r.absentPct)}`}>{pct(r.absentPct)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-paper font-medium">
                <td className="px-4 py-2">الإجمالي ({activeStudents} طالب نشط)</td>
                <td className="px-4 py-2">{day.totals.marked}</td>
                <td className="px-4 py-2">{day.totals.present}</td>
                <td className="px-4 py-2">{day.totals.absent}</td>
                <td className={`px-4 py-2 ${tone(day.totals.absentPct)}`}>{pct(day.totals.absentPct)}</td>
              </tr>
            </tbody>
            </table>
          </div>
        </section>
      )}

      {mode === 'week' && (
        <>
          <section className="card p-4">
            <h2 className="text-lg font-medium mb-3">توزيع الغياب على أيام الأسبوع</h2>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">اليوم</th>
                  <th className="px-4 py-2 font-medium">المُسجَّل</th>
                  <th className="px-4 py-2 font-medium">حاضر</th>
                  <th className="px-4 py-2 font-medium">غائب</th>
                  <th className="px-4 py-2 font-medium">نسبة الغياب</th>
                </tr>
              </thead>
              <tbody>
                {week.dayRows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-4 py-2">{r.marked}</td>
                    <td className="px-4 py-2">{r.present}</td>
                    <td className="px-4 py-2">{r.absent}</td>
                    <td className={`px-4 py-2 font-medium ${tone(r.absentPct)}`}>{pct(r.absentPct)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-paper font-medium">
                  <td className="px-4 py-2">إجمالي الأسبوع</td>
                  <td className="px-4 py-2">{week.totals.marked}</td>
                  <td className="px-4 py-2">{week.totals.present}</td>
                  <td className="px-4 py-2">{week.totals.absent}</td>
                  <td className={`px-4 py-2 ${tone(week.totals.absentPct)}`}>{pct(week.totals.absentPct)}</td>
                </tr>
              </tbody>
              </table>
            </div>
          </section>
          <section className="card p-4">
            <h2 className="text-lg font-medium mb-3">الغياب بالفصول</h2>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الفصل</th>
                  <th className="px-4 py-2 font-medium">المُسجَّل</th>
                  <th className="px-4 py-2 font-medium">حاضر</th>
                  <th className="px-4 py-2 font-medium">غائب</th>
                  <th className="px-4 py-2 font-medium">نسبة الغياب</th>
                </tr>
              </thead>
              <tbody>
                {week.classRows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-4 py-2">{r.marked}</td>
                    <td className="px-4 py-2">{r.present}</td>
                    <td className="px-4 py-2">{r.absent}</td>
                    <td className={`px-4 py-2 font-medium ${tone(r.absentPct)}`}>{pct(r.absentPct)}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {mode === 'month' && (
        <>
          <section className="card p-4">
            <h2 className="text-lg font-medium mb-3">
              تقرير شهري — {new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الفصل</th>
                  <th className="px-4 py-2 font-medium">المُسجَّل</th>
                  <th className="px-4 py-2 font-medium">حاضر</th>
                  <th className="px-4 py-2 font-medium">غائب</th>
                  <th className="px-4 py-2 font-medium">نسبة الغياب</th>
                </tr>
              </thead>
              <tbody>
                {month.classRows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="px-4 py-2">{r.label}</td>
                    <td className="px-4 py-2">{r.marked}</td>
                    <td className="px-4 py-2">{r.present}</td>
                    <td className="px-4 py-2">{r.absent}</td>
                    <td className={`px-4 py-2 font-medium ${tone(r.absentPct)}`}>{pct(r.absentPct)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-paper font-medium">
                  <td className="px-4 py-2">إجمالي الشهر</td>
                  <td className="px-4 py-2">{month.totals.marked}</td>
                  <td className="px-4 py-2">{month.totals.present}</td>
                  <td className="px-4 py-2">{month.totals.absent}</td>
                  <td className={`px-4 py-2 ${tone(month.totals.absentPct)}`}>{pct(month.totals.absentPct)}</td>
                </tr>
              </tbody>
              </table>
            </div>
          </section>
          <section className="card p-4">
            <h2 className="text-lg font-medium mb-3">اتجاه الغياب اليومي خلال الشهر</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {month.dayRows.map((r) => (
                <div key={r.label} className="border border-border rounded-sm px-3 py-2 text-sm flex justify-between items-center">
                  <span className="text-muted">{r.label}</span>
                  <span className={`font-medium ${tone(r.absentPct)}`}>{pct(r.absentPct)}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
