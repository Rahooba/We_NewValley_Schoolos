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
  broadcastDate: z.string().optional().or(z.literal('')),
  theme: z.string().min(2, 'موضوع الإذاعة مطلوب'),
  className: z.string().optional().or(z.literal('')),
  coordinator: z.string().optional().or(z.literal('')),
  employeeId: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
});

export async function createBroadcast(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('broadcast.manage'))) return { error: 'ليس لديك صلاحية' };
  const parsed = schema.safeParse({
    broadcastDate: String(formData.get('broadcastDate') ?? ''),
    theme: String(formData.get('theme') ?? '').trim(),
    className: String(formData.get('className') ?? '').trim(),
    coordinator: String(formData.get('coordinator') ?? '').trim(),
    employeeId: String(formData.get('employeeId') ?? ''),
    status: String(formData.get('status') ?? 'scheduled'),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.broadcastSchedule.create({
      data: {
        broadcastDate: parsed.data.broadcastDate ? new Date(parsed.data.broadcastDate) : new Date(),
        theme: parsed.data.theme,
        className: parsed.data.className || null,
        coordinator: parsed.data.coordinator || null,
        employeeId: parsed.data.employeeId || null,
        status: parsed.data.status || 'scheduled',
        notes: parsed.data.notes || null
      }
    });
  } catch (err) {
    console.error('createBroadcast failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/broadcast');
  return { success: true };
}

export async function updateBroadcast(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('broadcast.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = schema.safeParse({
    broadcastDate: String(formData.get('broadcastDate') ?? ''),
    theme: String(formData.get('theme') ?? '').trim(),
    className: String(formData.get('className') ?? '').trim(),
    coordinator: String(formData.get('coordinator') ?? '').trim(),
    employeeId: String(formData.get('employeeId') ?? ''),
    status: String(formData.get('status') ?? 'scheduled'),
    notes: String(formData.get('notes') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.broadcastSchedule.update({
      where: { id },
      data: {
        broadcastDate: parsed.data.broadcastDate ? new Date(parsed.data.broadcastDate) : new Date(),
        theme: parsed.data.theme,
        className: parsed.data.className || null,
        coordinator: parsed.data.coordinator || null,
        employeeId: parsed.data.employeeId || null,
        status: parsed.data.status || 'scheduled',
        notes: parsed.data.notes || null
      }
    });
  } catch (err) {
    console.error('updateBroadcast failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/broadcast');
  return { success: true };
}

export async function deleteBroadcast(id: string) {
  if (!(await requirePermission('broadcast.manage'))) return;
  await prisma.broadcastSchedule.delete({ where: { id } });
  revalidatePath('/quality/broadcast');
}
