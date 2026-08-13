'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { Status } from '@/generated/prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type UsersActionState = { error?: string; success?: string };

const MIN_PASSWORD = 8;

export async function updateUserAccess(
  _prev: UsersActionState,
  formData: FormData
): Promise<UsersActionState> {
  const session = await auth();
  const sessionPermissions = (session?.user as any)?.permissions ?? [];
  if (!sessionPermissions.includes('users.manage')) return { error: 'غير مصرح' };

  const userId = String(formData.get('userId') ?? '');
  const roleId = String(formData.get('roleId') ?? '');
  const status = String(formData.get('status') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');

  if (!userId || !roleId) return { error: 'بيانات غير صالحة' };
  if (status !== 'ACTIVE' && status !== 'INACTIVE') return { error: 'حالة غير صالحة' };

  if (userId === session?.user?.id) {
    return { error: 'لا يمكنك تعديل حسابك من هنا — عدّل الإيميل وكلمة المرور من الملف الشخصي' };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!target) return { error: 'المستخدم غير موجود' };

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: 'الدور غير موجود' };

  if (newPassword && newPassword.length < MIN_PASSWORD) {
    return { error: `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD} أحرف` };
  }

  const data: { roleId: string; status: Status; passwordHash?: string } = {
    roleId,
    status: status === 'ACTIVE' ? Status.ACTIVE : Status.INACTIVE
  };
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({ where: { id: userId }, data });
  revalidatePath('/settings/users');

  const changed = [
    target.role.name !== role.name ? `الدور: ${target.role.name} ← ${role.name}` : null,
    target.status !== data.status ? `الحالة: ${target.status} ← ${data.status}` : null,
    newPassword ? 'كلمة مرور جديدة' : null
  ]
    .filter(Boolean)
    .join(', ');

  return { success: `تم تحديث حساب ${target.fullName} — ${changed}` };
}
