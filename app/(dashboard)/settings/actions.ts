'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

export async function updateSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('settings.manage')) return { error: 'ليس لديك صلاحية' };

  const keys = [
    'remedial_threshold_percent',
    'enrichment_threshold_percent',
    'absence_warning_threshold_days',
    'absence_warning_break_days'
  ];
  try {
    for (const key of keys) {
      const value = String(formData.get(key) ?? '').trim();
      if (value === '') continue;
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
  } catch (err) {
    console.error('updateSettings failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/settings');
  revalidatePath('/exams');
  revalidatePath('/exams/grade');
  revalidatePath('/quality/warnings');
  return { success: true };
}
