import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { WorkshopForm } from './WorkshopForm';
import { deleteWorkshopSession } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function WorkshopsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('workshops.manage');
  if (!permissions.includes('workshops.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [sessions, sessionTotal, workshopNames] = await Promise.all([
    prisma.workshopSession.findMany({
      include: { employee: true },
      orderBy: { timestamp: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.workshopSession.count(),
    prisma.workshopSession.findMany({
      select: { workshopName: true },
      distinct: ['workshopName'],
      orderBy: { workshopName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(sessionTotal / PAGE_SIZE));
  const names = workshopNames.map((w) => w.workshopName).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">سجل الورش</h1>
        <p className="text-sm text-muted">محاضر فتح وغلق الورش المدرسية وتأمينها</p>
      </div>

      {canManage && <WorkshopForm workshopNames={names} />}

      <section>
        <h2 className="text-lg font-medium mb-3">محاضر فتح وغلق الورش</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الوقت</th>
                <th className="px-4 py-2 font-medium">الورشة</th>
                <th className="px-4 py-2 font-medium">الإجراء</th>
                <th className="px-4 py-2 font-medium">التأمين</th>
                <th className="px-4 py-2 font-medium">بواسطة</th>
                <th className="px-4 py-2 font-medium">ملاحظات</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-muted">
                    لا توجد محاضر بعد
                  </td>
                </tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2">{new Date(s.timestamp).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-2 font-medium">{s.workshopName}</td>
                  <td className="px-4 py-2">
                    {s.action === 'open' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">فتح</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">غلق</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {s.securityChecked ? '✓ نعم' : <span className="text-red-600">✗ غير مؤمنة</span>}
                  </td>
                  <td className="px-4 py-2">{s.employee.fullName}</td>
                  <td className="px-4 py-2">{s.notes ?? '—'}</td>
                  {canManage && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteWorkshopSession.bind(null, s.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={params} />
        </div>
      </section>
    </div>
  );
}
