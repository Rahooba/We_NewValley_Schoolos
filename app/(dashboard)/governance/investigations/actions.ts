'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PERMISSION = 'investigation_committee.manage';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

const committeeSchema = z.object({
  subject: z.string().min(2, 'الموضوع مطلوب'),
  memberIds: z.array(z.string()).optional(),
  committeeOpinion: z.string().optional().or(z.literal('')),
  adminOpinion: z.string().optional().or(z.literal('')),
  relatedStudentId: z.string().optional().or(z.literal('')),
  relatedEmployeeId: z.string().optional().or(z.literal(''))
});

export async function formInvestigationCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission(PERMISSION))) {
    return { error: 'ليس لديك صلاحية تشكيل لجنة الاستجواب' };
  }

  const parsed = committeeSchema.safeParse({
    subject: String(formData.get('subject') ?? '').trim(),
    memberIds: formData.getAll('member').map(String).filter((v) => v.length > 0),
    committeeOpinion: String(formData.get('committeeOpinion') ?? '').trim(),
    adminOpinion: String(formData.get('adminOpinion') ?? '').trim(),
    relatedStudentId: String(formData.get('relatedStudentId') ?? '').trim(),
    relatedEmployeeId: String(formData.get('relatedEmployeeId') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const createdBy = session?.user?.id ?? 'unknown';

  try {
    await prisma.investigationCommittee.create({
      data: {
        subject: parsed.data.subject,
        memberIds: parsed.data.memberIds ?? [],
        committeeOpinion: parsed.data.committeeOpinion || null,
        adminOpinion: parsed.data.adminOpinion || null,
        relatedStudentId: parsed.data.relatedStudentId || null,
        relatedEmployeeId: parsed.data.relatedEmployeeId || null,
        createdBy
      }
    });
  } catch (err) {
    console.error('formInvestigationCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/investigations');
  return { success: true };
}

const decideSchema = z.object({
  committeeOpinion: z.string().optional().or(z.literal('')),
  adminOpinion: z.string().optional().or(z.literal('')),
  status: z.enum(['open', 'decided']).default('open')
});

export async function decideInvestigationCommittee(
  committeeId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission(PERMISSION))) return { error: 'ليس لديك صلاحية' };

  const parsed = decideSchema.safeParse({
    committeeOpinion: String(formData.get('committeeOpinion') ?? '').trim(),
    adminOpinion: String(formData.get('adminOpinion') ?? '').trim(),
    status: String(formData.get('status') ?? 'open') as 'open' | 'decided'
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.investigationCommittee.update({
      where: { id: committeeId },
      data: {
        committeeOpinion: parsed.data.committeeOpinion || null,
        adminOpinion: parsed.data.adminOpinion || null,
        status: parsed.data.status
      }
    });
  } catch (err) {
    console.error('decideInvestigationCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/investigations');
  return { success: true };
}

export async function deleteInvestigationCommittee(id: string) {
  if (!(await requirePermission(PERMISSION))) return;
  try {
    await prisma.investigationCommittee.delete({ where: { id } });
  } catch (err) {
    console.error('deleteInvestigationCommittee failed', err);
  }
  revalidatePath('/governance/investigations');
}
