import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UsersManager } from './UsersManager';

const PAGE_SIZE = 25;

export default async function UsersSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('users.manage')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [users, userTotal, roles] = await Promise.all([
    prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.user.count(),
    prisma.role.findMany({
      include: { _count: { select: { permissions: true } } },
      orderBy: { level: 'desc' }
    })
  ]);

  return (
    <UsersManager
      myUserId={session?.user?.id ?? ''}
      page={page}
      totalUsers={userTotal}
      searchParams={params}
      users={users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        roleId: u.roleId,
        roleName: u.role.name,
        status: u.status,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null
      }))}
      roles={roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        level: r.level,
        permissionCount: r._count.permissions
      }))}
    />
  );
}
