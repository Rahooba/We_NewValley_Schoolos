'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

export async function createWarning(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('warnings.manage'))) return { error: 'ليس لديك صلاحية إصدار إنذارات' };
  const schema = z.object({
    studentId: z.string().min(1, 'اختر الطالب'),
    reason: z.string().min(2, 'سبب الإنذار مطلوب'),
    warningDate: z.string().optional().or(z.literal('')),
    message: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    reason: String(formData.get('reason') ?? '').trim(),
    warningDate: String(formData.get('warningDate') ?? ''),
    message: String(formData.get('message') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const sentByUserId = (session?.user as any)?.id as string | undefined;

  try {
    await prisma.warningLog.create({
      data: {
        studentId: parsed.data.studentId,
        reason: parsed.data.reason,
        warningDate: parsed.data.warningDate ? new Date(parsed.data.warningDate) : new Date(),
        message: parsed.data.message || null,
        sentByUserId
      }
    });
  } catch (err) {
    console.error('createWarning failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/warnings');
  return { success: true };
}

export async function deleteWarning(id: string) {
  if (!(await requirePermission('warnings.manage'))) return;
  await prisma.warningLog.delete({ where: { id } });
  revalidatePath('/quality/warnings');
}
