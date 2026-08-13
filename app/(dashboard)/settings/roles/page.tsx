import { prisma } from '@/lib/prisma';
import { RoleCard } from './RoleCard';

export default async function RolesSettingsPage() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: { select: { id: true, permissionKey: true, module: true } } }
        }
      },
      orderBy: { level: 'desc' }
    }),
    prisma.permission.findMany({ orderBy: { module: 'asc' } })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">الأدوار والصلاحيات</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={{
              id: role.id,
              name: role.name,
              description: role.description,
              level: role.level,
              code: role.code,
              permissions: role.permissions.map((rp) => ({
                id: rp.id,
                permissionId: rp.permissionId,
                permissionKey: rp.permission.permissionKey,
                module: rp.permission.module
              }))
            }}
            permissions={permissions.map((p) => ({
              id: p.id,
              permissionKey: p.permissionKey,
              module: p.module
            }))}
          />
        ))}
      </div>
    </div>
  );
}
