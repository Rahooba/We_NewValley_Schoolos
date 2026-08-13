import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { weeksRange, toISODate } from '@/lib/weeks';
import { CleanlinessGrid } from './CleanlinessGrid';
import { deleteCleanliness } from './actions';

export const dynamic = 'force-dynamic';

export default async function CleanlinessPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('cleanliness.manage');
  if (!permissions.includes('cleanliness.view')) redirect('/dashboard/forbidden');

  const weeks = weeksRange(-3, 0).map((w) => ({
    mondayISO: w.mondayISO,
    label: w.label,
    rangeLabel: w.rangeLabel
  }));
  const mondayFirst = new Date(`${weeks[0].mondayISO}T00:00:00`);
  const lastSunday = new Date(`${weeks[weeks.length - 1].mondayISO}T00:00:00`);
  lastSunday.setDate(lastSunday.getDate() + 6);

  const [sections, logs] = await Promise.all([
    prisma.section.findMany({ orderBy: { name: 'asc' } }),
    prisma.cleanlinessLog.findMany({
      where: { cleanlinessDate: { gte: mondayFirst, lte: lastSunday } },
      orderBy: { cleanlinessDate: 'desc' }
    })
  ]);

  const classOptions = Array.from(new Set(sections.map((s) => s.name).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ar')
  );

  const values: Record<string, Record<string, number>> = {};
  for (const log of logs) {
    const key = toISODate(new Date(log.cleanlinessDate));
    if (!values[key]) values[key] = {};
    values[key][log.className ?? ''] = log.score;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">متابعة النظافة</h1>
        <p className="text-sm text-muted">درجة النظافة لكل فصل أسبوعيًا (من 10)</p>
      </div>

      <CleanlinessGrid weeks={weeks} classes={classOptions} values={values} canManage={canManage} />

      <section>
        <h2 className="text-lg font-medium mb-3">سجل التقييمات</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الأسبوع</th>
                <th className="px-4 py-2 font-medium">الفصل</th>
                <th className="px-4 py-2 font-medium">الدرجة</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="px-4 py-6 text-center text-muted">
                    لا توجد تقييمات بعد
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {new Date(l.cleanlinessDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                  </td>
                  <td className="px-4 py-2">{l.className ?? l.area ?? '—'}</td>
                  <td className="px-4 py-2 font-medium">{l.score}/10</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteCleanliness.bind(null, l.id)} />
                    </td>
                  )}
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
