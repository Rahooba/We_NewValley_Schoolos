import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { BroadcastForm } from './BroadcastForm';
import { updateBroadcast, deleteBroadcast } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'مجدولة',
  done: 'منفذة'
};

export default async function BroadcastPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('broadcast.manage');
  if (!permissions.includes('broadcast.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [broadcasts, total, sections, employees] = await Promise.all([
    prisma.broadcastSchedule.findMany({
      include: { employee: true },
      orderBy: { broadcastDate: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.broadcastSchedule.count(),
    prisma.section.findMany({ orderBy: { name: 'asc' } }),
    prisma.employee.findMany({ where: { status: 'ACTIVE' }, orderBy: { fullName: 'asc' } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const classOptions = Array.from(
    new Set(sections.map((s) => s.name).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'ar'));

  const employeeOptions = employees.map((e) => ({ id: e.id, label: e.fullName }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">جدول الإذاعة المدرسية</h1>
        <p className="text-sm text-muted">توزيع فقرات الإذاعة على الفصول</p>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة إذاعة</h2>
          <BroadcastForm classes={classOptions} employees={employeeOptions} />
        </section>
      )}

      <section>
        <ManageRows
          columns={[
            { key: 'broadcastDateDisplay', label: 'التاريخ' },
            { key: 'theme', label: 'الموضوع' },
            { key: 'className', label: 'الفصل المكلف' },
            { key: 'coordinator', label: 'المشرف' },
            { key: 'status', label: 'الحالة' }
          ]}
          rows={broadcasts.map((b) => ({
            id: b.id,
            broadcastDate: b.broadcastDate.toISOString(),
            broadcastDateDisplay: new Date(b.broadcastDate).toLocaleDateString('ar-EG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            }),
            theme: b.theme,
            className: b.className ?? '',
            coordinator: b.employee?.fullName ?? b.coordinator ?? '',
            employeeId: b.employeeId ?? '',
            status: b.status,
            notes: b.notes ?? ''
          }))}
          fields={
            [
              { name: 'broadcastDate', label: 'التاريخ', type: 'date' },
              { name: 'theme', label: 'الموضوع', type: 'text', required: true },
              {
                name: 'className',
                label: 'الفصل المكلف',
                type: 'select',
                options: [{ value: '', label: '—' }, ...classOptions.map((c) => ({ value: c, label: c }))]
              },
              {
                name: 'employeeId',
                label: 'المشرف',
                type: 'select',
                options: [{ value: '', label: '—' }, ...employeeOptions.map((e) => ({ value: e.id, label: e.label }))]
              },
              { name: 'notes', label: 'ملاحظات', type: 'textarea' },
              {
                name: 'status',
                label: 'الحالة',
                type: 'select',
                options: [
                  { value: 'scheduled', label: 'مجدولة' },
                  { value: 'done', label: 'منفذة' }
                ]
              }
            ] satisfies ManageField[]
          }
          updateAction={canManage ? updateBroadcast : undefined}
          deleteAction={canManage ? deleteBroadcast : undefined}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد إعدادات إذاعة بعد"
        />
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
