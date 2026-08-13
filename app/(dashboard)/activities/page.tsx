import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import Pagination from '@/components/Pagination';
import { ActivityForm } from './ActivityForm';
import { updateActivity, deleteActivity } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  planned: 'مخطط له',
  done: 'منفذ',
  cancelled: 'ملغي'
};

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('activities.manage');
  if (!permissions.includes('activities.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [activities, total, plannedTotal] = await Promise.all([
    prisma.schoolActivity.findMany({
      orderBy: { activityDate: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.schoolActivity.count(),
    prisma.schoolActivity.count({ where: { status: 'planned' } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const planned = plannedTotal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">الأنشطة المدرسية</h1>
        <p className="text-sm text-muted">مخطط له {planned} من إجمالي {total}</p>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة نشاط</h2>
          <ActivityForm />
        </section>
      )}

      <section>
        <ManageRows
          columns={[
            { key: 'title', label: 'النشاط' },
            { key: 'type', label: 'النوع' },
            { key: 'activityDateDisplay', label: 'التاريخ' },
            { key: 'location', label: 'المكان' },
            { key: 'organizer', label: 'المنظم' },
            { key: 'status', label: 'الحالة' }
          ]}
          rows={activities.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description ?? '',
            type: a.type ?? '',
            activityDate: a.activityDate.toISOString(),
            activityDateDisplay: new Date(a.activityDate).toLocaleDateString('ar-EG'),
            location: a.location ?? '',
            organizer: a.organizer ?? '',
            status: a.status
          }))}
          fields={
            [
              { name: 'title', label: 'العنوان', type: 'text', required: true },
              { name: 'description', label: 'الوصف', type: 'textarea' },
              {
                name: 'type',
                label: 'النوع',
                type: 'select',
                options: [
                  { value: '', label: '—' },
                  { value: 'رياضي', label: 'رياضي' },
                  { value: 'ثقافي', label: 'ثقافي' },
                  { value: 'اجتماعي', label: 'اجتماعي' },
                  { value: 'علمي', label: 'علمي' },
                  { value: 'ترفيهي', label: 'ترفيهي' }
                ]
              },
              { name: 'activityDate', label: 'التاريخ', type: 'date' },
              { name: 'location', label: 'المكان', type: 'text' },
              { name: 'organizer', label: 'المنظم', type: 'text' },
              {
                name: 'status',
                label: 'الحالة',
                type: 'select',
                options: [
                  { value: 'planned', label: 'مخطط له' },
                  { value: 'done', label: 'منفذ' },
                  { value: 'cancelled', label: 'ملغي' }
                ]
              }
            ] satisfies ManageField[]
          }
          updateAction={canManage ? updateActivity : undefined}
          deleteAction={canManage ? deleteActivity : undefined}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد أنشطة بعد"
        />
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>
    </div>
  );
}
