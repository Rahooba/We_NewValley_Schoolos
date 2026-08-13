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

const trainingSchema = z.object({
  title: z.string().min(2, 'عنوان التدريب مطلوب'),
  description: z.string().optional().or(z.literal('')),
  trainerName: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'التاريخ مطلوب'),
  attendeeIds: z.array(z.string()).min(1, 'اختر موظفًا واحدًا على الأقل')
});

export async function createTraining(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('trainings.manage'))) return { error: 'ليس لديك صلاحية' };

  const rawAttendees = formData.getAll('attendeeIds').map(String);
  const parsed = trainingSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    trainerName: String(formData.get('trainerName') ?? '').trim(),
    date: String(formData.get('date') ?? ''),
    attendeeIds: rawAttendees
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.training.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        trainerName: parsed.data.trainerName || null,
        date: new Date(`${parsed.data.date}T00:00:00`),
        attendeeIds: parsed.data.attendeeIds
      }
    });
  } catch (err) {
    console.error('createTraining failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/trainings');
  return { success: true };
}

export async function deleteTraining(id: string) {
  if (!(await requirePermission('trainings.manage'))) return;
  await prisma.training.delete({ where: { id } });
  revalidatePath('/trainings');
}
