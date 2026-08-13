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

const sessionSchema = z.object({
  workshopName: z.string().min(2, 'اسم الورشة مطلوب'),
  action: z.enum(['open', 'close']),
  securityChecked: z.boolean().optional(),
  notes: z.string().optional().or(z.literal(''))
});

export async function createWorkshopSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('workshops.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = sessionSchema.safeParse({
    workshopName: String(formData.get('workshopName') ?? '').trim(),
    action: String(formData.get('action') ?? ''),
    securityChecked: formData.get('securityChecked') === 'on',
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return { error: 'لا يوجد موظف مرتبط بحسابك' };

  try {
    await prisma.workshopSession.create({
      data: {
        workshopName: parsed.data.workshopName,
        action: parsed.data.action,
        securityChecked: parsed.data.securityChecked,
        notes: parsed.data.notes || null,
        employeeId
      }
    });
  } catch (err) {
    console.error('createWorkshopSession failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/workshops');
  return { success: true };
}

export async function deleteWorkshopSession(id: string) {
  if (!(await requirePermission('workshops.manage'))) return;
  await prisma.workshopSession.delete({ where: { id } });
  revalidatePath('/workshops');
}
