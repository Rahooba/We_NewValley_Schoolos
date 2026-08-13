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

const violationSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  severity: z.enum(['minor', 'medium', 'severe']),
  description: z.string().min(3, 'اكتب وصف المخالفة')
});

export async function createViolation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('violations.record'))) return { error: 'ليس لديك صلاحية' };

  const parsed = violationSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    severity: String(formData.get('severity') ?? ''),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.studentViolation.create({
      data: {
        studentId: parsed.data.studentId,
        severity: parsed.data.severity,
        description: parsed.data.description,
        recordedBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createViolation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/professional-transformation/violations');
  return { success: true };
}

export async function decideViolation(
  violationId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('violations.act'))) return { error: 'ليس لديك صلاحية' };

  const actionTaken = String(formData.get('actionTaken') ?? '').trim();
  if (!actionTaken) return { error: 'اكتب الإجراء المتخذ' };

  try {
    await prisma.studentViolation.update({
      where: { id: violationId },
      data: { actionTaken, actionTakenBy: (await auth())?.user?.id ?? 'unknown' }
    });
  } catch (err) {
    console.error('decideViolation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/professional-transformation/violations');
  return { success: true };
}

export async function deleteViolation(id: string) {
  if (!(await requirePermission('violations.record'))) return;
  await prisma.studentViolation.delete({ where: { id } });
  revalidatePath('/professional-transformation/violations');
}