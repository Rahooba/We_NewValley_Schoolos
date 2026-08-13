import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { PermissionGate } from '@/components/PermissionGate';
// import { ComplaintPanel } from './ComplaintPanel';
import { Form, List } from './ComplaintPanel';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function ComplaintsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canView = permissions.includes('complaint.view') || permissions.includes('complaint.create');
  if (!canView) redirect('/dashboard/forbidden');

  const canCreate = permissions.includes('complaint.create');
  const canManage = permissions.includes('complaint.manage');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [complaints, total, users] = await Promise.all([
    prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.complaint.count(),
    prisma.user.findMany({ select: { id: true, fullName: true } })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const userNames = new Map(users.map((u) => [u.id, u.fullName]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">صندوق الشكاوى والمقترحات</h1>
        <p className="text-sm text-muted">
          تفريغ الشكاوى الورقية في النظام — الاستقبال وشئون الطلاب (إدخال) / المديرون والجودة (متابعة)
        </p>
      </div>

      <PermissionGate permission="complaint.create">
        <section>
          <h2 className="text-lg font-medium mb-3">تسجيل شكوى / مقترح جديد</h2>
          {/* <ComplaintPanel.Form /> */}
          <Form />
        </section>
      </PermissionGate>

      <section>
        <h2 className="text-lg font-medium mb-3">كل الشكاوى والمقترحات ({complaints.length})</h2>
        {/* <ComplaintPanel.List
          canManage={canManage}
          complaints={complaints.map((c) => ({
            id: c.id,
            type: c.type,
            fromType: c.fromType,
            fromName: c.fromName,
            contact: c.contact,
            content: c.content,
            status: c.status,
            enteredByName: userNames.get(c.enteredBy) ?? '—',
            createdAt: c.createdAt.toISOString()
          }))}
        /> */}
        <List
  canManage={canManage}
  complaints={complaints.map((c) => ({
    id: c.id,
    type: c.type,
    fromType: c.fromType,
    fromName: c.fromName,
    contact: c.contact,
    content: c.content,
    status: c.status,
    enteredByName: userNames.get(c.enteredBy) ?? '—',
    createdAt: c.createdAt.toISOString(),
  }))}
/>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}