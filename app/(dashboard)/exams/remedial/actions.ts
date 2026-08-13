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

export async function createRemedialFlag(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('remedial.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    studentId: z.string().min(1, 'اختر الطالب'),
    examId: z.string().optional().or(z.literal('')),
    subject: z.string().min(1, 'المادة مطلوبة'),
    reason: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    examId: String(formData.get('examId') ?? ''),
    subject: String(formData.get('subject') ?? '').trim(),
    reason: String(formData.get('reason') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.remedialFlag.create({
      data: {
        studentId: parsed.data.studentId,
        examId: parsed.data.examId || null,
        subject: parsed.data.subject,
        reason: parsed.data.reason || null
      }
    });
  } catch (err) {
    console.error('createRemedialFlag failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/exams/remedial');
  return { success: true };
}

export async function resolveRemedialFlag(id: string) {
  if (!(await requirePermission('remedial.manage'))) return;
  await prisma.remedialFlag.update({
    where: { id },
    data: { status: 'resolved', resolvedAt: new Date() }
  });
  revalidatePath('/exams/remedial');
}

export async function deleteRemedialFlag(id: string) {
  if (!(await requirePermission('remedial.manage'))) return;
  await prisma.remedialFlag.delete({ where: { id } });
  revalidatePath('/exams/remedial');
}

export async function createFormativeAssessment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('remedial.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    studentId: z.string().min(1, 'اختر الطالب'),
    subject: z.string().min(1, 'المادة مطلوبة'),
    score: z.string().min(1, 'الدرجة مطلوبة'),
    maxScore: z.string().min(1, 'الدرجة الكلية مطلوبة'),
    assessmentDate: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    subject: String(formData.get('subject') ?? '').trim(),
    score: String(formData.get('score') ?? ''),
    maxScore: String(formData.get('maxScore') ?? ''),
    assessmentDate: String(formData.get('assessmentDate') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const recordedBy = (session?.user as any)?.id as string | undefined;

  try {
    await prisma.formativeAssessment.create({
      data: {
        studentId: parsed.data.studentId,
        subject: parsed.data.subject,
        score: Number(parsed.data.score),
        maxScore: Number(parsed.data.maxScore),
        assessmentDate: parsed.data.assessmentDate ? new Date(parsed.data.assessmentDate) : new Date(),
        notes: parsed.data.notes || null,
        recordedBy
      }
    });
  } catch (err) {
    console.error('createFormativeAssessment failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/exams/remedial');
  return { success: true };
}

export async function deleteFormativeAssessment(id: string) {
  if (!(await requirePermission('remedial.manage'))) return;
  await prisma.formativeAssessment.delete({ where: { id } });
  revalidatePath('/exams/remedial');
}
