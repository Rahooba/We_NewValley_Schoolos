import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { DeleteButton } from '@/components/DeleteButton';
import { ImprovementPlanForm, PlanStatusSelect } from './QuickForms';
import {
  updateImprovementPlan,
  deleteImprovementPlan,
  submitPlanStatus
} from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد التنفيذ',
  reviewed: 'تحت المراجعة',
  completed: 'منفذة'
};

export default async function ImprovementPlansPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const userId = (session?.user as any)?.id as string | undefined;
  const canManage = permissions.includes('improvement_plans.manage');
  const canReview = permissions.includes('improvement_plans.review');
  if (!permissions.includes('improvement_plans.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [plans, total, openCount, mineCount, users] = await Promise.all([
    prisma.improvementPlan.findMany({
      include: { owner: true },
      orderBy: { dueDate: 'asc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.improvementPlan.count(),
    prisma.improvementPlan.count({
      where: { status: { in: ['open', 'in_progress'] } }
    }),
    prisma.improvementPlan.count({
      where: { ownerId: userId, status: { not: 'completed' } }
    }),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: { role: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const userOptions = users.map((u) => ({
    id: u.id,
    label: `${u.fullName}${u.role ? ` — ${u.role.name}` : ''}`
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display mb-1">خطط التحسين</h1>
          <p className="text-sm text-muted">
            مفتوح {openCount} — خططك قيد التنفيذ {mineCount}
          </p>
        </div>
        <Link href="/quality" className="text-xs text-brand border border-border rounded-sm px-3 py-1.5 hover:border-brand">
          الجودة
        </Link>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة خطة تحسين</h2>
          <ImprovementPlanForm users={userOptions} />
        </section>
      )}

      <section>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">العنوان</th>
                <th className="px-4 py-2 font-medium">تاريخ الاستحقاق</th>
                <th className="px-4 py-2 font-medium">المسئول</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                {(canManage || canReview) && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 && (
                <tr>
                  <td colSpan={(canManage || canReview) ? 5 : 4} className="px-4 py-6 text-center text-muted">
                    لا توجد خطط تحسين بعد
                  </td>
                </tr>
              )}
              {plans.map((p) => {
                const isMine = p.ownerId === userId;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      {p.title}
                      {p.description && <span className="text-xs text-muted block">{p.description}</span>}
                      {isMine && <span className="text-xs text-brand block">مخصصة لك</span>}
                    </td>
                    <td className="px-4 py-2">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="px-4 py-2">{p.owner?.fullName ?? '—'}</td>
                    <td className="px-4 py-2">
                      {(canManage || canReview || isMine) ? (
                        <PlanStatusSelect id={p.id} status={p.status} />
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      )}
                    </td>
                    {(canManage || canReview) && (
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {canManage && <DeleteButton onDelete={deleteImprovementPlan.bind(null, p.id)} />}
                          {canReview && p.status !== 'completed' && (
                            <form action={submitPlanStatus}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="status" value="completed" />
                              <button type="submit" className="text-xs text-emerald-600 hover:underline">
                                إغلاق
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">تعديل الخطة (إدارة)</h2>
          <ManageRows
            columns={[
              { key: 'title', label: 'العنوان' },
              { key: 'dueDateDisplay', label: 'تاريخ الاستحقاق' },
              { key: 'ownerName', label: 'المسئول' },
              { key: 'status', label: 'الحالة' }
            ]}
            rows={plans.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description ?? '',
              dueDate: p.dueDate ? p.dueDate.toISOString() : '',
              dueDateDisplay: p.dueDate ? new Date(p.dueDate).toLocaleDateString('ar-EG') : '—',
              ownerId: p.ownerId ?? '',
              ownerName: p.owner?.fullName ?? '—',
              status: p.status
            }))}
            fields={
              [
                { name: 'title', label: 'العنوان', type: 'text', required: true },
                { name: 'description', label: 'الوصف', type: 'textarea' },
                { name: 'dueDate', label: 'تاريخ الاستحقاق', type: 'date' },
                {
                  name: 'ownerId',
                  label: 'المسئول عن التنفيذ',
                  type: 'select',
                  options: [{ value: '', label: '—' }, ...userOptions.map((u) => ({ value: u.id, label: u.label }))]
                },
                {
                  name: 'status',
                  label: 'الحالة',
                  type: 'select',
                  options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
                }
              ] satisfies ManageField[]
            }
            updateAction={updateImprovementPlan}
            deleteAction={deleteImprovementPlan}
            canEdit
            canDelete
            emptyText="لا توجد خطط تحسين بعد"
          />
        </section>
      )}
    </div>
  );
}
