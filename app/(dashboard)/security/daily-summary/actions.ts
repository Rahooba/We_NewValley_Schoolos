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

const summarySchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  summary: z.string().min(3, 'اكتب ملخص نهاية اليوم'),
  incidentsReported: z.boolean().optional(),
  incidentNotes: z.string().optional().or(z.literal(''))
});

export async function submitDailySummary(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('security.daily_summary.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = summarySchema.safeParse({
    date: String(formData.get('date') ?? ''),
    summary: String(formData.get('summary') ?? '').trim(),
    incidentsReported: formData.get('incidentsReported') === 'on',
    incidentNotes: String(formData.get('incidentNotes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const userId = (session?.user as any)?.id ?? '';
  const date = new Date(`${parsed.data.date}T00:00:00`);

  try {
    const existing = await prisma.securityDailySummary.findUnique({ where: { date } });
    if (existing) {
      // One entry per day: a second submit edits the existing entry.
      await prisma.securityDailySummary.update({
        where: { id: existing.id },
        data: {
          summary: parsed.data.summary,
          incidentsReported: parsed.data.incidentsReported,
          incidentNotes: parsed.data.incidentsReported ? parsed.data.incidentNotes || null : null,
          submittedBy: userId
        }
      });
    } else {
      await prisma.securityDailySummary.create({
        data: {
          date,
          summary: parsed.data.summary,
          incidentsReported: parsed.data.incidentsReported,
          incidentNotes: parsed.data.incidentsReported ? parsed.data.incidentNotes || null : null,
          submittedBy: userId
        }
      });
    }
  } catch (err) {
    console.error('submitDailySummary failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/security/daily-summary');
  return { success: true };
}
