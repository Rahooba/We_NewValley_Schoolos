'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

const schema = z.object({
  title: z.string().min(2, 'عنوان التقرير مطلوب'),
  module: z.string().min(1, 'الوحدة مطلوبة')
});

export async function generateReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('reports.view')) return { error: 'ليس لديك صلاحية' };

  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    module: String(formData.get('module') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.report.create({
      data: {
        title: parsed.data.title,
        module: parsed.data.module,
        generatedBy: session.user?.name ?? null
      }
    });
  } catch (err) {
    console.error('generateReport failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/reports');
  return {};
}

export async function deleteReport(id: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('reports.view')) return;
  await prisma.report.delete({ where: { id } });
  revalidatePath('/reports');
}
