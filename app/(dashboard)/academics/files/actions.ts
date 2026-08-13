'use server';

import { revalidatePath } from 'next/cache';
import { del, rename } from '@vercel/blob';
import { uploadPrivateFile } from '@/lib/blob-upload';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

async function canManageFiles(): Promise<boolean> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes('lesson_plans.manage');
}

// Deletes the blob from the store and cleans up every DB row that pointed at it.
export async function deleteFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await canManageFiles())) return { error: 'ليس لديك صلاحية إدارة الملفات' };
  const url = String(formData.get('url') ?? '').trim();
  if (!url) return { error: 'رابط الملف مطلوب' };

  try {
    await del(url);
    await prisma.$transaction([
      // Plan row stays so the teacher can re-upload; only the file/submission is cleared.
      prisma.lessonPlan.updateMany({ where: { fileUrl: url }, data: { fileUrl: null, submittedAt: null } }),
      prisma.attendanceDocument.deleteMany({ where: { fileUrl: url } }),
      prisma.studentDocument.deleteMany({ where: { fileUrl: url } }),
      prisma.report.updateMany({ where: { fileUrl: url }, data: { fileUrl: null } })
    ]);
  } catch (err) {
    console.error('deleteFile failed', err);
    return { error: 'فشل حذف الملف، حاول مجددًا' };
  }

  revalidatePath('/academics/files');
  revalidatePath('/academics');
  return { success: true };
}

// Overwrites the same pathname: URL stays identical, so every DB reference keeps working.
export async function replaceFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await canManageFiles())) return { error: 'ليس لديك صلاحية إدارة الملفات' };
  const pathname = String(formData.get('pathname') ?? '').trim();
  const file = formData.get('file') as File | null;
  if (!pathname) return { error: 'مسار الملف مطلوب' };
  if (!file || file.size === 0) return { error: 'اختر ملفًا جديدًا أولًا' };

  try {
    await uploadPrivateFile(pathname, file, {
      allowOverwrite: true,
      contentType: file.type || undefined,
    });
  } catch (err) {
    console.error('replaceFile failed', err);
    return { error: 'فشل استبدال الملف، حاول مجددًا' };
  }

  revalidatePath('/academics/files');
  return { success: true };
}

const fileNamePattern = /^[\p{L}\p{N}._-]{1,120}$/u;

// Renames (moves) the blob to a new filename in the same folder and updates
// every DB row that referenced the old URL.
export async function renameFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await canManageFiles())) return { error: 'ليس لديك صلاحية إدارة الملفات' };
  const url = String(formData.get('url') ?? '').trim();
  const pathname = String(formData.get('pathname') ?? '').trim();
  const newName = String(formData.get('newName') ?? '').trim();
  if (!url || !pathname) return { error: 'بيانات الملف مطلوبة' };
  if (!fileNamePattern.test(newName) || newName.includes('/')) {
    return { error: 'اسم ملف غير صالح (حروف وأرقام ونقاط وشرطات فقط)' };
  }

  const parent = pathname.includes('/') ? pathname.slice(0, pathname.lastIndexOf('/')) + '/' : '';
  const newPathname = parent + newName;
  if (newPathname === pathname) return { error: 'الاسم الجديد مطابق للقديم' };

  try {
    const result = await rename(url, newPathname, { access: 'private' });
    await prisma.$transaction([
      prisma.lessonPlan.updateMany({ where: { fileUrl: url }, data: { fileUrl: result.url } }),
      prisma.attendanceDocument.updateMany({ where: { fileUrl: url }, data: { fileUrl: result.url } }),
      prisma.studentDocument.updateMany({ where: { fileUrl: url }, data: { fileUrl: result.url } }),
      prisma.report.updateMany({ where: { fileUrl: url }, data: { fileUrl: result.url } })
    ]);
  } catch (err) {
    console.error('renameFile failed', err);
    return { error: 'فشلت إعادة التسمية، حاول مجددًا' };
  }

  revalidatePath('/academics/files');
  revalidatePath('/academics');
  return { success: true };
}
