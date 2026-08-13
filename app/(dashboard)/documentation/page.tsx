import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import Pagination from '@/components/Pagination';
import { WorkDocumentationForm } from './WorkDocumentationForm';
import {
  updateWorkDocumentation,
  deleteWorkDocumentation
} from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function DocumentationPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('work_documentation.manage');
  if (!permissions.includes('work_documentation.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [docs, total] = await Promise.all([
    prisma.workDocumentation.findMany({
      include: { recordedByUser: true },
      orderBy: { documentedAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.workDocumentation.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">توثيق الأعمال</h1>
        <p className="text-sm text-muted">سجل الإثباتات والأعمال المنجزة</p>
      </div>

      {canManage && (
        <section>
          <h2 className="text-lg font-medium mb-3">إضافة إثبات عمل</h2>
          <WorkDocumentationForm />
        </section>
      )}

      <section>
        <ManageRows
          columns={[
            { key: 'title', label: 'العنوان' },
            { key: 'department', label: 'القسم' },
            { key: 'documentedAtDisplay', label: 'التاريخ' },
            { key: 'recordedByName', label: 'المسجل' },
            { key: 'fileUrl', label: 'المرفق' }
          ]}
          rows={docs.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description ?? '',
            department: d.department ?? '',
            documentedAt: d.documentedAt.toISOString(),
            documentedAtDisplay: new Date(d.documentedAt).toLocaleDateString('ar-EG'),
            recordedByName: d.recordedByUser?.fullName ?? '—',
            fileUrl: d.fileUrl ?? ''
          }))}
          fields={
            [
              { name: 'title', label: 'العنوان', type: 'text', required: true },
              { name: 'description', label: 'الوصف', type: 'textarea' },
              { name: 'department', label: 'القسم', type: 'text' },
              { name: 'documentedAt', label: 'التاريخ', type: 'date' },
              { name: 'fileUrl', label: 'رابط المرفق', type: 'text' }
            ] satisfies ManageField[]
          }
          updateAction={canManage ? updateWorkDocumentation : undefined}
          deleteAction={canManage ? deleteWorkDocumentation : undefined}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد أعمال موثقة بعد"
        />
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </section>
    </div>
  );
}
