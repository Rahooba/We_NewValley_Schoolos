import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PermissionGate } from '@/components/PermissionGate';
import { addGroup, deleteGroup, type ActionState } from '../governance/actions';
import { AddGroupForm } from './AddGroupForm';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('governance.view')) redirect('/dashboard/forbidden');

  const canManage = permissions.includes('board.manage');

  const groups = await prisma.communicationGroup.findMany({ orderBy: { name: 'asc' } });

  const PLATFORM_ICONS: Record<string, string> = {
    whatsapp: '📱',
    telegram: '✈️',
    facebook: '📘',
    other: '🔗'
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">جروبات المدرسة</h1>
        <p className="text-sm text-muted">مجموعات التواصل الرسمية — الإدارة (إضافة/حذف) / الجميع (اطلاع)</p>
      </div>

      <PermissionGate permission="board.manage">
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة مجموعة جديدة</h2>
          <AddGroupForm />
        </section>
      </PermissionGate>

      <section>
        <h2 className="text-lg font-medium mb-3">المجموعات ({groups.length})</h2>
        <div className="space-y-3">
          {groups.length === 0 && (
            <div className="card p-6 text-center text-muted">لا توجد مجموعات بعد</div>
          )}
          {groups.map((g) => (
            <div key={g.id} className="card p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PLATFORM_ICONS[g.platform] ?? '🔗'}</span>
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-muted">{g.platform}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {g.link && (
                  <a href={g.link} target="_blank" className="text-xs text-brand hover:underline">
                    فتح الرابط
                  </a>
                )}
                {g.description && <p className="text-xs text-muted">{g.description}</p>}
                <PermissionGate permission="board.manage">
                  <form action={deleteGroup.bind(null, g.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      حذف
                    </button>
                  </form>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}