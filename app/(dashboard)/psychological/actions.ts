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
  return { session, ok: !!session && permissions.includes('psychological_cases.manage') };
}

const createSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  title: z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional(),
  nextSessionAt: z.string().optional()
});

export async function createPsychologicalCase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { session, ok } = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية إدارة الحالات النفسية' };

  const parsed = createSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    nextSessionAt: String(formData.get('nextSessionAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.psychologicalCase.create({
      data: {
        studentId: parsed.data.studentId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        nextSessionAt: parsed.data.nextSessionAt ? new Date(parsed.data.nextSessionAt) : null,
        assignedTo: session!.user!.id!
      }
    });
  } catch (err) {
    console.error('createPsychologicalCase failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/psychological');
  return { success: true };
}

const updateSchema = z.object({
  caseId: z.string().min(1),
  status: z.enum(STATUSES),
  sessions: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  nextSessionAt: z.string().optional()
});

export async function updatePsychologicalCase(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { ok } = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية إدارة الحالات النفسية' };

  const parsed = updateSchema.safeParse({
    caseId: String(formData.get('caseId') ?? ''),
    status: String(formData.get('status') ?? 'open'),
    sessions: String(formData.get('sessions') ?? '0'),
    notes: String(formData.get('notes') ?? '').trim(),
    nextSessionAt: String(formData.get('nextSessionAt') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.psychologicalCase.update({
      where: { id: parsed.data.caseId },
      data: {
        status: parsed.data.status,
        sessions: parsed.data.sessions,
        notes: parsed.data.notes || null,
        nextSessionAt: parsed.data.nextSessionAt ? new Date(parsed.data.nextSessionAt) : null
      }
    });
  } catch (err) {
    console.error('updatePsychologicalCase failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/psychological');
  return { success: true };
}

export async function deletePsychologicalCase(id: string) {
  const { ok } = await canManage();
  if (!ok) return;
  await prisma.psychologicalCase.delete({ where: { id } });
  revalidatePath('/psychological');
}
