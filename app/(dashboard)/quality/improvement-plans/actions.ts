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

const planSchema = z.object({
  title: z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal(''))
});

export async function createImprovementPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('improvement_plans.manage'))) return { error: 'ليس لديك صلاحية' };
  const parsed = planSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    ownerId: String(formData.get('ownerId') ?? ''),
    status: String(formData.get('status') ?? 'open')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.improvementPlan.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        ownerId: parsed.data.ownerId || null,
        status: parsed.data.status || 'open'
      }
    });
  } catch (err) {
    console.error('createImprovementPlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/improvement-plans');
  return { success: true };
}

export async function updateImprovementPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('improvement_plans.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = planSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    ownerId: String(formData.get('ownerId') ?? ''),
    status: String(formData.get('status') ?? 'open')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.improvementPlan.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        ownerId: parsed.data.ownerId || null,
        status: parsed.data.status || 'open'
      }
    });
  } catch (err) {
    console.error('updateImprovementPlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/improvement-plans');
  return { success: true };
}

// Self-management: the assigned owner (or any manager) can advance the plan status.
export async function setPlanStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !status) return { error: 'بيانات غير صحيحة' };

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('improvement_plans.manage');
  const canReview = permissions.includes('improvement_plans.review');

  const plan = await prisma.improvementPlan.findUnique({ where: { id } });
  if (!plan) return { error: 'الخطة غير موجودة' };
  const isOwner = plan.ownerId === userId;
  if (!isOwner && !canManage && !canReview) return { error: 'ليس لديك صلاحية' };

  try {
    await prisma.improvementPlan.update({ where: { id }, data: { status } });
  } catch (err) {
    console.error('setPlanStatus failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/quality/improvement-plans');
  return { success: true };
}

// Wrapper so the select can be used directly as a <form action>.
export async function submitPlanStatus(formData: FormData): Promise<void> {
  await setPlanStatus({} as ActionState, formData);
}

export async function deleteImprovementPlan(id: string) {
  if (!(await requirePermission('improvement_plans.manage'))) return;
  await prisma.improvementPlan.delete({ where: { id } });
  revalidatePath('/quality/improvement-plans');
}
