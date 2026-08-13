import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { CheckInForm } from './CheckInForm';
import { CheckOutButton } from './CheckOutButton';
import { updateVisitor, deleteVisitor, deleteLog } from './actions';

const PAGE_SIZE = 25;

export default async function VisitorsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('visitors.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [logs, logTotal, visitors] = await Promise.all([
    prisma.visitorLog.findMany({
      include: { visitor: true },
      orderBy: { checkIn: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.visitorLog.count(),
    prisma.visitor.findMany({ orderBy: { fullName: 'asc' } })
  ]);
  const totalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">الزوار</h1>
      <CheckInForm />

      {canManage && (
        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">بيانات الزوار</h2>
          <ManageRows
            columns={[
              { key: 'fullName', label: 'الاسم' },
              { key: 'phone', label: 'الهاتف' },
              { key: 'purpose', label: 'الغرض' }
            ]}
            rows={visitors.map((v) => ({
              id: v.id,
              fullName: v.fullName,
              phone: v.phone ?? '',
              purpose: v.purpose ?? ''
            }))}
            fields={
              [
                { name: 'fullName', label: 'الاسم', type: 'text', required: true },
                { name: 'phone', label: 'الهاتف', type: 'text' },
                { name: 'purpose', label: 'الغرض', type: 'text' }
              ] satisfies ManageField[]
            }
            updateAction={updateVisitor}
            deleteAction={deleteVisitor}
            canEdit={canManage}
            canDelete={canManage}
            emptyText="لا يوجد زوار بعد"
          />
        </section>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الزائر</th>
              <th className="px-4 py-3 font-medium">الهاتف</th>
              <th className="px-4 py-3 font-medium">الغرض</th>
              <th className="px-4 py-3 font-medium">وقت الدخول</th>
              <th className="px-4 py-3 font-medium">وقت الخروج</th>
              {canManage && <th className="px-4 py-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-muted">
                  لا يوجد زوار مسجلون بعد
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-3">{l.visitor.fullName}</td>
                <td className="px-4 py-3">{l.visitor.phone ?? '—'}</td>
                <td className="px-4 py-3">{l.visitor.purpose ?? '—'}</td>
                <td className="px-4 py-3">{new Date(l.checkIn).toLocaleString('ar-EG')}</td>
                <td className="px-4 py-3">
                  {l.checkOut ? new Date(l.checkOut).toLocaleString('ar-EG') : '—'}
                </td>
                <td className="px-4 py-3">
                  {!l.checkOut && canManage && <CheckOutButton logId={l.id} />}
                  {canManage && <DeleteButton onDelete={deleteLog.bind(null, l.id)} />}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </div>
    </div>
  );
}
