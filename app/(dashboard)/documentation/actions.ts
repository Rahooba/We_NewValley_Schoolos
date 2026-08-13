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
  title: z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  documentedAt: z.string().optional().or(z.literal('')),
  fileUrl: z.string().optional().or(z.literal(''))
});

export async function createWorkDocumentation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('work_documentation.manage'))) return { error: 'ليس لديك صلاحية' };
  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
    documentedAt: String(formData.get('documentedAt') ?? ''),
    fileUrl: String(formData.get('fileUrl') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const session = await auth();
  const recordedBy = (session?.user as any)?.id as string | undefined;

  try {
    await prisma.workDocumentation.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        department: parsed.data.department || null,
        documentedAt: parsed.data.documentedAt ? new Date(parsed.data.documentedAt) : new Date(),
        fileUrl: parsed.data.fileUrl || null,
        recordedBy
      }
    });
  } catch (err) {
    console.error('createWorkDocumentation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/documentation');
  return { success: true };
}

export async function updateWorkDocumentation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('work_documentation.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = schema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
    documentedAt: String(formData.get('documentedAt') ?? ''),
    fileUrl: String(formData.get('fileUrl') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.workDocumentation.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        department: parsed.data.department || null,
        documentedAt: parsed.data.documentedAt ? new Date(parsed.data.documentedAt) : new Date(),
        fileUrl: parsed.data.fileUrl || null
      }
    });
  } catch (err) {
    console.error('updateWorkDocumentation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/documentation');
  return { success: true };
}

export async function deleteWorkDocumentation(id: string) {
  if (!(await requirePermission('work_documentation.manage'))) return;
  await prisma.workDocumentation.delete({ where: { id } });
  revalidatePath('/documentation');
}
