'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

const STATUSES = ['open', 'in_progress', 'closed'] as const;

async function canManage(): Promise<{ session: any; ok: boolean }> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return { session, ok: !!session && permissions.includes('social_cases.manage') };
}

const createSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  title: z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional(),
  followUpAt: z.string().optional()
});

export async function createSocialCase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, ok } = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية إدارة الحالات الاجتماعية' };

  const parsed = createSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    followUpAt: String(formData.get('followUpAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.socialCase.create({
      data: {
        studentId: parsed.data.studentId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null,
        assignedTo: session!.user!.id!
      }
    });
  } catch (err) {
    console.error('createSocialCase failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/social');
  return { success: true };
}

const updateSchema = z.object({
  caseId: z.string().min(1),
  status: z.enum(STATUSES),
  notes: z.string().optional(),
  followUpAt: z.string().optional()
});

export async function updateSocialCase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ok } = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية إدارة الحالات الاجتماعية' };

  const parsed = updateSchema.safeParse({
    caseId: String(formData.get('caseId') ?? ''),
    status: String(formData.get('status') ?? 'open'),
    notes: String(formData.get('notes') ?? '').trim(),
    followUpAt: String(formData.get('followUpAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.socialCase.update({
      where: { id: parsed.data.caseId },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes || null,
        followUpAt: parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null
      }
    });
  } catch (err) {
    console.error('updateSocialCase failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/social');
  return { success: true };
}

export async function deleteSocialCase(id: string) {
  const { ok } = await canManage();
  if (!ok) return;
  await prisma.socialCase.delete({ where: { id } });
  revalidatePath('/social');
}
