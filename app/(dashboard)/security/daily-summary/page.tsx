import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DailySummaryForm } from './DailySummaryForm';

export const dynamic = 'force-dynamic';

export default async function DailySummaryPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('security.daily_summary.manage');
  if (!permissions.includes('security.daily_summary.view')) redirect('/dashboard/forbidden');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [summary, recent, gateLogs, visitorLogs] = await Promise.all([
    prisma.securityDailySummary.findUnique({ where: { date: today } }),
    prisma.securityDailySummary.findMany({
      where: { date: { gte: yesterday, lte: today } },
      orderBy: { date: 'desc' },
      take: 7
    }),
    prisma.gateLog.findMany({
      where: { timestamp: { gte: today } },
      select: { direction: true }
    }),
    prisma.visitorLog.findMany({
      where: { checkIn: { gte: today } },
      include: { visitor: true },
      orderBy: { checkIn: 'desc' }
    })
  ]);

  const inCount = gateLogs.filter((l) => l.direction === 'in').length;
  const outCount = gateLogs.filter((l) => l.direction === 'out').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">ملخص نهاية اليوم</h1>
        <p className="text-sm text-muted">تقرير أمني واحد لكل يوم — حركة البوابة والزوار وأي حوادث</p>
      </div>

      {canManage && (
        <DailySummaryForm
          date={today.toISOString().slice(0, 10)}
          existing={
            summary ? { summary: summary.summary, incidentsReported: summary.incidentsReported, incidentNotes: summary.incidentNotes } : null
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-display text-emerald-600">{inCount}</p>
          <p className="text-xs text-muted">دخول اليوم (بوابة)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display text-red-600">{outCount}</p>
          <p className="text-xs text-muted">خروج اليوم (بوابة)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-display">{visitorLogs.length}</p>
          <p className="text-xs text-muted">زوار اليوم</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">ملخص اليوم</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {summary ? (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">التاريخ</th>
                  <th className="px-4 py-2 font-medium">الملخص</th>
                  <th className="px-4 py-2 font-medium">الحوادث</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(summary.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </td>
                  <td className="px-4 py-3">{summary.summary}</td>
                  <td className="px-4 py-3">
                    {summary.incidentsReported ? (
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                        {summary.incidentNotes ?? 'تم الإفصاح'}
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">لا توجد</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-10 text-center text-muted text-sm">لم يُرسل ملخص لهذا اليوم بعد.</p>
          )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">زوار اليوم</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الزائر</th>
                <th className="px-4 py-2 font-medium">الغرض</th>
                <th className="px-4 py-2 font-medium">الدخول</th>
                <th className="px-4 py-2 font-medium">الخروج</th>
              </tr>
            </thead>
            <tbody>
              {visitorLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    لا يوجد زوار اليوم
                  </td>
                </tr>
              )}
              {visitorLogs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2">{l.visitor.fullName}</td>
                  <td className="px-4 py-2">{l.visitor.purpose ?? '—'}</td>
                  <td className="px-4 py-2">{new Date(l.checkIn).toLocaleTimeString('ar-EG')}</td>
                  <td className="px-4 py-2">{l.checkOut ? new Date(l.checkOut).toLocaleTimeString('ar-EG') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}
