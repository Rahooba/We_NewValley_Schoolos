'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ProfileActionState = { error?: string; success?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export async function updateEmail(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: 'غير مصرح' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newEmail = String(formData.get('newEmail') ?? '').trim().toLowerCase();

  if (!EMAIL_RE.test(newEmail)) return { error: 'صيغة الإيميل غير صحيحة' };
  if (!currentPassword) return { error: 'أدخل كلمة المرور الحالية لتأكيد العملية' };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'المستخدم غير موجود' };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: 'كلمة المرور الحالية غير صحيحة' };

  if (newEmail === user.email) return { error: 'الإيميل الجديد مطابق للإيميل الحالي' };

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing && existing.id !== userId) return { error: 'هذا الإيميل مستخدم من قبل' };

  try {
    await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
    revalidatePath('/settings/profile');
    return { success: 'تم تحديث الإيميل بنجاح — استخدم الإيميل الجديد عند تسجيل الدخول القادم' };
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') return { error: 'هذا الإيميل مستخدم من قبل' };
    return { error: 'حدث خطأ أثناء التحديث' };
  }
}

export async function updatePassword(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: 'غير مصرح' };

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword) return { error: 'أدخل كلمة المرور الحالية' };
  if (newPassword.length < MIN_PASSWORD) return { error: `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD} أحرف` };
  if (newPassword !== confirmPassword) return { error: 'كلمتا المرور غير متطابقتين' };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'المستخدم غير موجود' };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: 'كلمة المرور الحالية غير صحيحة' };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: 'تم تحديث كلمة المرور بنجاح' };
}
