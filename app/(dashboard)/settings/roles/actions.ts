'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function canManage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes('roles.manage');
}

export type ActionState = { error?: string; success?: boolean };

const roleSchema = z.object({
  name: z.string().min(2, 'اسم الدور مطلوب'),
  description: z.string().optional().or(z.literal(''))
});

export async function updateRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await canManage())) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = roleSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.role.update({
      where: { id },
      data: { name: parsed.data.name, description: parsed.data.description || null }
    });
  } catch (err) {
    console.error('updateRole failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/settings/roles');
  return { success: true };
}

export async function toggleRolePermission(roleId: string, permissionId: string, add: boolean) {
  if (!(await canManage())) return;

  try {
    if (add) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId }
      });
    } else {
      await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    }
  } catch (err) {
    console.error('toggleRolePermission failed', err);
    return;
  }
  revalidatePath('/settings/roles');
}
