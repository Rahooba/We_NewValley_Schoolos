'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { uploadPrivateFile } from '@/lib/blob-upload';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

const recordSchema = z.object({
  category: z.enum(['camp', 'project', 'competition']),
  subtype: z.string().min(1, 'اختر النوع الفرعي'),
  title: z.string().optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal(''))
});

export async function createActivityRecord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('camps.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = recordSchema.safeParse({
    category: String(formData.get('category') ?? ''),
    subtype: String(formData.get('subtype') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    startDate: String(formData.get('startDate') ?? '').trim(),
    endDate: String(formData.get('endDate') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.activityRecord.create({
      data: {
        category: parsed.data.category,
        subtype: parsed.data.subtype,
        title: parsed.data.title || null,
        startDate: parsed.data.startDate ? new Date(`${parsed.data.startDate}T00:00:00`) : null,
        endDate: parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00`) : null,
        createdBy: session.user.id
      }
    });
  } catch (err) {
    console.error('createActivityRecord failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/professional-transformation');
  return { success: true };
}

export async function deleteActivityRecord(id: string) {
  if (!(await requirePermission('camps.manage'))) return;
  await prisma.activityRecord.delete({ where: { id } });
  revalidatePath('/professional-transformation');
}

const procedureSchema = z.object({
  activityId: z.string().min(1, 'اختر النشاط'),
  notes: z.string().min(3, 'اكتب ملاحظات الإجراء'),
  file: z.instanceof(File).optional()
});

export async function addProcedure(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('camps.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = procedureSchema.safeParse({
    activityId: String(formData.get('activityId') ?? ''),
    notes: String(formData.get('notes') ?? '').trim(),
    file: formData.get('file') as File | null
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  let fileUrl: string | undefined;
  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadPrivateFile(`activities/procedures/${Date.now()}-${safeName}`, file, { contentType: file.type });
      fileUrl = blob.url;
    } catch (err) {
      console.error('addProcedure upload failed', err);
      return { error: 'فشل رفع الملف' };
    }
  }

  try {
    await prisma.activityProcedure.create({
      data: {
        activityId: parsed.data.activityId,
        notes: parsed.data.notes,
        fileUrl,
        createdBy: session.user.id
      }
    });
  } catch (err) {
    console.error('addProcedure failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/professional-transformation');
  return { success: true };
}

const docSchema = z.object({
  activityId: z.string().min(1, 'اختر النشاط'),
  caption: z.string().optional().or(z.literal('')),
  file: z.instanceof(File)
});

export async function addDocumentation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('camps.manage'))) return { error: 'ليس لديك صلاحية' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'يرجى اختيار صورة' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'صيغة الصورة غير مدعومة (JPG / PNG / WebP فقط)' };
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await uploadPrivateFile(`activities/docs/${Date.now()}-${safeName}`, file, { contentType: file.type });
    await prisma.activityDocumentation.create({
      data: {
        activityId: String(formData.get('activityId') ?? ''),
        photoUrl: blob.url,
        caption: String(formData.get('caption') ?? '').trim() || null,
        uploadedBy: session.user.id
      }
    });
  } catch (err) {
    console.error('addDocumentation failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/professional-transformation');
  return { success: true };
}