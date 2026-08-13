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

const sessionSchema = z.object({
  labName: z.string().min(2, 'اسم المعمل مطلوب'),
  action: z.enum(['open', 'close']),
  safetyChecklistPassed: z.boolean().optional(),
  notes: z.string().optional().or(z.literal(''))
});

export async function createLabSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('labs.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = sessionSchema.safeParse({
    labName: String(formData.get('labName') ?? '').trim(),
    action: String(formData.get('action') ?? ''),
    safetyChecklistPassed: formData.get('safetyChecklistPassed') === 'on',
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return { error: 'لا يوجد موظف مرتبط بحسابك' };

  try {
    await prisma.labSession.create({
      data: {
        labName: parsed.data.labName,
        action: parsed.data.action,
        safetyChecklistPassed: parsed.data.safetyChecklistPassed,
        notes: parsed.data.notes || null,
        employeeId
      }
    });
  } catch (err) {
    console.error('createLabSession failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/labs');
  return { success: true };
}

export async function deleteLabSession(id: string) {
  if (!(await requirePermission('labs.manage'))) return;
  await prisma.labSession.delete({ where: { id } });
  revalidatePath('/labs');
}

const instructionSchema = z.object({
  labName: z.string().min(2, 'اسم المعمل مطلوب'),
  title: z.string().min(2, 'عنوان التعليمات مطلوب'),
  content: z.string().min(3, 'نص التعليمات مطلوب')
});

export async function createLabInstruction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('labs.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = instructionSchema.safeParse({
    labName: String(formData.get('labName') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.labInstruction.create({ data: parsed.data });
  } catch (err) {
    console.error('createLabInstruction failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/labs');
  return { success: true };
}

export async function deleteLabInstruction(id: string) {
  if (!(await requirePermission('labs.manage'))) return;
  await prisma.labInstruction.delete({ where: { id } });
  revalidatePath('/labs');
}
