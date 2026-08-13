import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { PermissionGate } from '@/components/PermissionGate';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { updateSportsActivity, deleteSportsActivity } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function SportsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('activities.view')) redirect('/dashboard/forbidden');
  const canManage = permissions.includes('activities.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [activities, total, students] = await Promise.all([
    prisma.sportsActivity.findMany({
      orderBy: { date: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.sportsActivity.count(),
    prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { class: true, section: true },
      orderBy: { fullName: 'asc' }
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const studentNames = new Map(students.map((s) => [s.id, s.fullName]));

  return (
    <div>
      <div className="mb-6">
        <Link href="/activities" className="text-xs text-brand hover:underline">
          ← الأنشطة المدرسية
        </Link>
        <h1 className="text-2xl font-display mt-1">الأنشطة الرياضية</h1>
        <p className="text-sm text-muted">متابعة النشاطات الرياضية بالمدرسة والمشاركين فيها</p>
      </div>

      <ManageRows
        columns={[
          { key: 'title', label: 'النشاط' },
          { key: 'dateDisplay', label: 'التاريخ' },
          { key: 'description', label: 'الوصف' },
          { key: 'participantsCount', label: 'المشاركون' }
        ]}
        rows={activities.map((a) => ({
          id: a.id,
          title: a.title,
          date: a.date.toISOString(),
          dateDisplay: new Date(a.date).toLocaleDateString('ar-EG'),
          description: a.description ?? '—',
          participantsCount: a.participantIds.length
        }))}
        fields={
          [
            {
              name: 'title',
              label: 'عنوان النشاط',
              type: 'text',
              required: true
            },
            { name: 'date', label: 'التاريخ', type: 'date', required: true },
            { name: 'description', label: 'الوصف', type: 'textarea' }
          ] satisfies ManageField[]
        }
        updateAction={updateSportsActivity}
        deleteAction={deleteSportsActivity}
        canEdit={canManage}
        canDelete={canManage}
        emptyText="لا توجد نشاطات رياضية بعد"
      />

      <section className="mt-8">
        <h2 className="text-lg font-medium mb-3">المشاركون</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">النشاط</th>
                <th className="px-4 py-2 font-medium">المشاركون</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-muted">
                    لا توجد نشاطات بعد
                  </td>
                </tr>
              )}
              {activities.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{a.title}</td>
                  <td className="px-4 py-2">
                    {a.participantIds.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {a.participantIds.map((pid) => (
                          <span key={pid} className="text-xs bg-paper border border-border rounded-full px-2 py-0.5">
                            {studentNames.get(pid) ?? 'طالب محذوف'}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}