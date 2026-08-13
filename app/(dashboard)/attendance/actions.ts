'use server';

import { revalidatePath } from 'next/cache';
import { uploadPrivateFile } from '@/lib/blob-upload';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type DocActionState = { error?: string; success?: boolean };

export type AttendanceDocType = 'students' | 'employees';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;

function requiredPermission(type: AttendanceDocType): string {
  return type === 'students' ? 'attendance.students.manage' : 'attendance.employees.manage';
}

export async function uploadAttendanceDocument(
  type: AttendanceDocType,
  _prev: DocActionState,
  formData: FormData
): Promise<DocActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes(requiredPermission(type))) {
    return { error: 'ليس لديك صلاحية رفع المستندات' };
  }

  const file = formData.get('file') as File | null;
  const dateStr = String(formData.get('date') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!file || file.size === 0) return { error: 'يرجى اختيار ملف للرفع' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { error: 'يرجى اختيار التاريخ' };
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.test(file.name)) {
    return { error: 'صيغة الملف غير مدعومة (PDF / JPG / PNG فقط)' };
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  try {
    const blob = await uploadPrivateFile(
      `attendance/${type}/${dateStr}-${Date.now()}-${safeName}`,
      file,
      { contentType: file.type || undefined }
    );

    await prisma.attendanceDocument.create({
      data: {
        type,
        date,
        fileUrl: blob.url,
        uploadedBy: session.user!.id!,
        notes: notes || null
      }
    });
  } catch (err) {
    console.error('uploadAttendanceDocument failed', err);
    return {
      error:
        'فشل رفع الملف. تأكد من إعداد التخزين (متغير BLOB_READ_WRITE_TOKEN في ملف .env) ثم أعد المحاولة.'
    };
  }

  revalidatePath(type === 'students' ? '/attendance/students' : '/attendance/employees');
  return { success: true };
}

export async function deleteAttendanceDocument(
  type: AttendanceDocType,
  docId: string
): Promise<void> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes(requiredPermission(type))) return;

  try {
    await prisma.attendanceDocument.delete({ where: { id: docId } });
  } catch (err) {
    console.error('deleteAttendanceDocument failed', err);
    return;
  }

  revalidatePath(type === 'students' ? '/attendance/students' : '/attendance/employees');
}
