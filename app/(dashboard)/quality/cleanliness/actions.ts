'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function canManageCleanliness() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes('cleanliness.manage');
}

export type ActionState = { error?: string; success?: boolean };

export async function saveCleanliness(formData: FormData): Promise<void> {
  if (!(await canManageCleanliness())) return;

  const weekDate = String(formData.get('weekDate') ?? '');
  const className = String(formData.get('className') ?? '').trim();
  const score = Number(formData.get('score') ?? '');
  if (!weekDate || !className || Number.isNaN(score) || score < 0 || score > 10) {
    return;
  }

  const date = new Date(`${weekDate}T00:00:00`);
  const existing = await prisma.cleanlinessLog.findFirst({
    where: { cleanlinessDate: date, className }
  });

  try {
    if (existing) {
      await prisma.cleanlinessLog.update({ where: { id: existing.id }, data: { score } });
    } else {
      await prisma.cleanlinessLog.create({
        data: { cleanlinessDate: date, className, area: className, score, recordedBy: null }
      });
    }
  } catch (err) {
    console.error('saveCleanliness failed', err);
  }
  revalidatePath('/quality/cleanliness');
}

export async function deleteCleanliness(id: string) {
  if (!(await canManageCleanliness())) return;
  await prisma.cleanlinessLog.delete({ where: { id } });
  revalidatePath('/quality/cleanliness');
}
