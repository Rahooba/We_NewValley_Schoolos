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

const schema = z.object({
  title: z.string().min(2, 'العنوان مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  description: z.string().optional().or(z.literal('')),
  participants: z.array(z.string()).optional()
});

export async function createSportsActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('activities.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    date: String(formData.get('date') ?? ''),
    description: String(formData.get('description') ?? '').trim(),
    participants: formData
      .getAll('participant')
      .map(String)
      .filter((v) => v.length > 0)
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.sportsActivity.create({
      data: {
        title: parsed.data.title,
        date: new Date(`${parsed.data.date}T00:00:00`),
        description: parsed.data.description || null,
        participantIds: parsed.data.participants ?? [],
        createdBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createSportsActivity failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/activities/sports');
  return { success: true };
}

export async function updateSportsActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('activities.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    date: String(formData.get('date') ?? ''),
    description: String(formData.get('description') ?? '').trim(),
    participants: formData
      .getAll('participant')
      .map(String)
      .filter((v) => v.length > 0)
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.sportsActivity.update({
      where: { id },
      data: {
        title: parsed.data.title,
        date: new Date(`${parsed.data.date}T00:00:00`),
        description: parsed.data.description || null,
        participantIds: parsed.data.participants ?? []
      }
    });
  } catch (err) {
    console.error('updateSportsActivity failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/activities/sports');
  return { success: true };
}

export async function deleteSportsActivity(id: string) {
  if (!(await requirePermission('activities.manage'))) return;
  await prisma.sportsActivity.delete({ where: { id } });
  revalidatePath('/activities/sports');
}