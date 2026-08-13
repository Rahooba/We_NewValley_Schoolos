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

const caseSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  condition: z.string().min(2, 'اكتب الحالة المرضية'),
  actionTaken: z.string().optional().or(z.literal(''))
});

export async function createClinicCase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('clinic.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = caseSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    condition: String(formData.get('condition') ?? '').trim(),
    actionTaken: String(formData.get('actionTaken') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.clinicCase.create({
      data: {
        studentId: parsed.data.studentId,
        condition: parsed.data.condition,
        actionTaken: parsed.data.actionTaken || null,
        loggedBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createClinicCase failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/clinic');
  return { success: true };
}

export async function deleteClinicCase(id: string) {
  if (!(await requirePermission('clinic.manage'))) return;
  await prisma.clinicCase.delete({ where: { id } });
  revalidatePath('/clinic');
}

const cleanlinessSchema = z.object({
  status: z.enum(['DONE', 'ISSUE']),
  notes: z.string().optional().or(z.literal(''))
});

export async function createCleanlinessLog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('clinic.cleanliness.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = cleanlinessSchema.safeParse({
    status: String(formData.get('status') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.clinicCleanlinessLog.create({
      data: { status: parsed.data.status, notes: parsed.data.notes || null, checkedBy: session.user.id }
    });
  } catch (err) {
    console.error('createCleanlinessLog failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/clinic');
  return { success: true };
}

export async function deleteCleanlinessLog(id: string) {
  if (!(await requirePermission('clinic.cleanliness.manage'))) return;
  await prisma.clinicCleanlinessLog.delete({ where: { id } });
  revalidatePath('/clinic');
}