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

const shiftSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  employeeId: z.string().min(1, 'اختر الموظف'),
  shift: z.enum(['morning', 'evening', 'night']),
  notes: z.string().optional().or(z.literal(''))
});

export async function createShift(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('security.shifts.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = shiftSchema.safeParse({
    date: String(formData.get('date') ?? ''),
    employeeId: String(formData.get('employeeId') ?? ''),
    shift: String(formData.get('shift') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const existing = await prisma.securityShift.findFirst({
    where: {
      employeeId: parsed.data.employeeId,
      date: new Date(`${parsed.data.date}T00:00:00`)
    }
  });
  if (existing) return { error: 'هذا الموظف مسجل في وردية لنفس اليوم بالفعل' };

  try {
    await prisma.securityShift.create({
      data: {
        employeeId: parsed.data.employeeId,
        date: new Date(`${parsed.data.date}T00:00:00`),
        shift: parsed.data.shift,
        notes: parsed.data.notes || null
      }
    });
  } catch (err) {
    console.error('createShift failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/security/shifts');
  return { success: true };
}

export async function deleteShift(id: string) {
  if (!(await requirePermission('security.shifts.manage'))) return;
  await prisma.securityShift.delete({ where: { id } });
  revalidatePath('/security/shifts');
}
