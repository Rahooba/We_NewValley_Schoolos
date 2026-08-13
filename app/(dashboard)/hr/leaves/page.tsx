import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LeavesPanel } from './LeavesPanel';

export const dynamic = 'force-dynamic';

export default async function LeavesPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('hr.view')) redirect('/dashboard/forbidden');

  const canManage = permissions.includes('hr.edit');

  const [leaves, employees] = await Promise.all([
    prisma.leave.findMany({
      include: { employee: { select: { id: true, fullName: true, employmentCategory: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, employmentCategory: true }
    })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/hr" className="text-xs text-brand hover:underline">
          ← شئون العاملين
        </Link>
        <h1 className="text-2xl font-display mt-1">الإجازات</h1>
        <p className="text-sm text-muted">
          إدارة إجازات جميع الموظفين — إضافة، موافقة، أو رفض
        </p>
      </div>

      <LeavesPanel
        canManage={canManage}
        employees={employees.map((e) => ({
          id: e.id,
          fullName: e.fullName,
          employmentCategory: e.employmentCategory ?? 'contract'
        }))}
        leaves={leaves.map((l) => ({
          id: l.id,
          employeeName: l.employee.fullName,
          employeeId: l.employee.id,
          employmentCategory: l.employee.employmentCategory ?? 'contract',
          leaveType: l.leaveType,
          startDate: l.startDate.toISOString().slice(0, 10),
          endDate: l.endDate.toISOString().slice(0, 10),
          status: l.status,
          reason: l.reason ?? '',
          createdAt: l.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
