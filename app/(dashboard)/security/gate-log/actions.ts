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

const gateLogSchema = z.object({
  personType: z.enum(['student', 'employee', 'visitor']),
  personId: z.string().optional().or(z.literal('')),
  personName: z.string().optional().or(z.literal('')),
  direction: z.enum(['in', 'out']),
  notes: z.string().optional().or(z.literal(''))
});

export async function createGateLog(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('security.gate_log.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = gateLogSchema.safeParse({
    personType: String(formData.get('personType') ?? ''),
    personId: String(formData.get('personId') ?? ''),
    personName: String(formData.get('personName') ?? '').trim(),
    direction: String(formData.get('direction') ?? ''),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const userId = (session?.user as any)?.id ?? '';

  try {
    // Resolve the person name server-side so the log never trusts client input.
    let personName = parsed.data.personName;
    if (parsed.data.personType === 'student' && parsed.data.personId) {
      const s = await prisma.student.findUnique({
        where: { id: parsed.data.personId },
        select: { fullName: true, studentCode: true }
      });
      personName = s ? `${s.fullName} (${s.studentCode})` : parsed.data.personName;
    } else if (parsed.data.personType === 'employee' && parsed.data.personId) {
      const e = await prisma.employee.findUnique({
        where: { id: parsed.data.personId },
        select: { fullName: true, employeeCode: true }
      });
      personName = e ? `${e.fullName} (${e.employeeCode})` : parsed.data.personName;
    }
    if (!personName) return { error: 'يرجى تحديد الشخص أو كتابة اسم الزائر' };

    await prisma.gateLog.create({
      data: {
        personType: parsed.data.personType,
        personId: parsed.data.personId || null,
        personName,
        direction: parsed.data.direction,
        notes: parsed.data.notes || null,
        loggedBy: userId
      }
    });
  } catch (err) {
    console.error('createGateLog failed', err);
    return { error: 'حدث خطأ أثناء التسجيل' };
  }

  revalidatePath('/security/gate-log');
  return { success: true };
}

export async function deleteGateLog(id: string) {
  if (!(await requirePermission('security.gate_log.manage'))) return;
  await prisma.gateLog.delete({ where: { id } });
  revalidatePath('/security/gate-log');
}
