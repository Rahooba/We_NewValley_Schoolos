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

const checkInSchema = z.object({
  fullName: z.string().min(2, 'اسم الزائر مطلوب'),
  phone: z.string().optional().or(z.literal('')),
  purpose: z.string().optional().or(z.literal('')),
  hostName: z.string().optional().or(z.literal(''))
});

export async function checkInVisitor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('visitors.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = checkInSchema.safeParse({
    fullName: String(formData.get('fullName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim(),
    hostName: String(formData.get('hostName') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    const visitor = await prisma.visitor.create({
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        purpose: parsed.data.purpose || null
      }
    });
    await prisma.visitorLog.create({
      data: { visitorId: visitor.id, hostName: parsed.data.hostName || null }
    });
  } catch (err) {
    console.error('checkInVisitor failed', err);
    return { error: 'حدث خطأ أثناء تسجيل الزائر' };
  }

  revalidatePath('/visitors');
  return {};
}

export async function checkOutVisitor(logId: string) {
  if (!(await requirePermission('visitors.manage'))) return;
  await prisma.visitorLog.update({ where: { id: logId }, data: { checkOut: new Date() } });
  revalidatePath('/visitors');
}

// ---------------- Visitor edit/delete ----------------

const visitorSchema = z.object({
  fullName: z.string().min(2, 'اسم الزائر مطلوب'),
  phone: z.string().optional().or(z.literal('')),
  purpose: z.string().optional().or(z.literal(''))
});

export async function updateVisitor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('visitors.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = visitorSchema.safeParse({
    fullName: String(formData.get('fullName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.visitor.update({
      where: { id },
      data: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        purpose: parsed.data.purpose || null
      }
    });
  } catch (err) {
    console.error('updateVisitor failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/visitors');
  return { success: true };
}

export async function deleteVisitor(id: string) {
  if (!(await requirePermission('visitors.manage'))) return;
  await prisma.visitor.delete({ where: { id } });
  revalidatePath('/visitors');
}

// ---------------- Log delete ----------------

export async function deleteLog(id: string) {
  if (!(await requirePermission('visitors.manage'))) return;
  await prisma.visitorLog.delete({ where: { id } });
  revalidatePath('/visitors');
}
