import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { createNotice, deleteNotice, type ActionState } from '../actions';
import { AddNoticeForm } from './AddNoticeForm';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function NoticesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('governance.view')) redirect('/dashboard/forbidden');

  const canManage = permissions.includes('notices.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [notices, total] = await Promise.all([
    prisma.adminNotice.findMany({
      orderBy: { date: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.adminNotice.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">الأوامر الإدارية المستجدة</h1>
        <p className="text-sm text-muted">يضيق المدير الأكاديمي — مرئية للجميع</p>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة إعلان جديد</h2>
          <AddNoticeForm />
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">الإعلانات ({notices.length})</h2>
        <div className="space-y-3">
          {notices.length === 0 && (
            <div className="card p-6 text-center text-muted">لا توجد إعلانات بعد</div>
          )}
          {notices.map((n) => (
            <div key={n.id} className="card p-4 border-t-4 border-brand">
              <p className="text-sm">{n.content}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(n.date).toLocaleDateString('ar-EG')} — أضيف بواسطة {n.createdBy}
              </p>
              {canManage && (
                <div className="mt-2 flex justify-end">
                  <form action={deleteNotice.bind(null, n.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      حذف
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}