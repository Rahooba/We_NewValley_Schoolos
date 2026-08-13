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
  description: z.string().optional().or(z.literal('')),
  type: z.string().optional().or(z.literal('')),
  activityDate: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  organizer: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal(''))
});

export async function createActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('activities.manage'))) return { error: 'ليس لديك صلاحية' };
  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    type: String(formData.get('type') ?? '').trim(),
    activityDate: String(formData.get('activityDate') ?? ''),
    location: String(formData.get('location') ?? '').trim(),
    organizer: String(formData.get('organizer') ?? '').trim(),
    status: String(formData.get('status') ?? 'planned')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.schoolActivity.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        type: parsed.data.type || null,
        activityDate: parsed.data.activityDate ? new Date(parsed.data.activityDate) : new Date(),
        location: parsed.data.location || null,
        organizer: parsed.data.organizer || null,
        status: parsed.data.status || 'planned'
      }
    });
  } catch (err) {
    console.error('createActivity failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/activities');
  return { success: true };
}

export async function updateActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('activities.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    type: String(formData.get('type') ?? '').trim(),
    activityDate: String(formData.get('activityDate') ?? ''),
    location: String(formData.get('location') ?? '').trim(),
    organizer: String(formData.get('organizer') ?? '').trim(),
    status: String(formData.get('status') ?? 'planned')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.schoolActivity.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        type: parsed.data.type || null,
        activityDate: parsed.data.activityDate ? new Date(parsed.data.activityDate) : new Date(),
        location: parsed.data.location || null,
        organizer: parsed.data.organizer || null,
        status: parsed.data.status || 'planned'
      }
    });
  } catch (err) {
    console.error('updateActivity failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/activities');
  return { success: true };
}

export async function deleteActivity(id: string) {
  if (!(await requirePermission('activities.manage'))) return;
  await prisma.schoolActivity.delete({ where: { id } });
  revalidatePath('/activities');
}
