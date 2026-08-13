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

const meetingSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  attendees: z.string().optional().or(z.literal('')),
  notes: z.string().min(2, 'اكتب ملاحظات الاجتماع'),
  outcome: z.string().min(2, 'اكتب خلاصة الاجتماع')
});

export async function createSocialMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('social.meetings.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = meetingSchema.safeParse({
    date: String(formData.get('date') ?? ''),
    attendees: String(formData.get('attendees') ?? '').trim(),
    notes: String(formData.get('notes') ?? '').trim(),
    outcome: String(formData.get('outcome') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.socialMeeting.create({
      data: {
        date: new Date(`${parsed.data.date}T00:00:00`),
        attendees: parsed.data.attendees || null,
        notes: parsed.data.notes,
        outcome: parsed.data.outcome,
        createdBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createSocialMeeting failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/social/meetings');
  return { success: true };
}

export async function deleteSocialMeeting(id: string) {
  if (!(await requirePermission('social.meetings.manage'))) return;
  await prisma.socialMeeting.delete({ where: { id } });
  revalidatePath('/social/meetings');
}