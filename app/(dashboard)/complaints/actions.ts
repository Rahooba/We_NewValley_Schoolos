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
  type: z.enum(['complaint', 'suggestion']),
  fromType: z.enum(['student', 'employee', 'visitor']),
  fromName: z.string().optional().or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  content: z.string().min(3, 'اكتب محتوى الشكوى/المقترح')
});

export async function createComplaint(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('complaint.create'))) return { error: 'ليس لديك صلاحية' };

  const parsed = schema.safeParse({
    type: String(formData.get('type') ?? ''),
    fromType: String(formData.get('fromType') ?? ''),
    fromName: String(formData.get('fromName') ?? '').trim(),
    contact: String(formData.get('contact') ?? '').trim(),
    content: String(formData.get('content') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.complaint.create({
      data: {
        type: parsed.data.type,
        fromType: parsed.data.fromType,
        fromName: parsed.data.fromName || null,
        contact: parsed.data.contact || null,
        content: parsed.data.content,
        enteredBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createComplaint failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/complaints');
  return { success: true };
}

export async function updateComplaintStatus(
  complaintId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('complaint.manage'))) return { error: 'ليس لديك صلاحية' };

  const status = String(formData.get('status') ?? 'new');
  if (!['new', 'reviewed', 'resolved'].includes(status)) return { error: 'حالة غير صحيحة' };

  try {
    await prisma.complaint.update({ where: { id: complaintId }, data: { status } });
  } catch (err) {
    console.error('updateComplaintStatus failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/complaints');
  return { success: true };
}