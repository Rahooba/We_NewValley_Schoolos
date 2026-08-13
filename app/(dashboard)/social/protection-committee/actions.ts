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

const reportSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  content: z.string().min(3, 'اكتب محتوى المذكرة')
});

export async function submitSpecialistReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('specialist_report.submit'))) {
    return { error: 'ليس لديك صلاحية إرسال المذكرات' };
  }

  const parsed = reportSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    content: String(formData.get('content') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const employeeId = (session.user as any).employeeId as string | null | undefined;

  let fileUrl: string | undefined;
  const file = formData.get('file') as File | null;
  if (file && file.size > 0) {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      return { error: 'صيغة الملف غير مدعومة (PDF / JPG / PNG فقط)' };
    }
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadPrivateFile(
        `specialist-reports/${Date.now()}-${safeName}`,
        file,
        { contentType: file.type }
      );
      fileUrl = blob.url;
    } catch (err) {
      console.error('submitSpecialistReport upload failed', err);
      return { error: 'فشل رفع المرفق. تأكد من إعداد التخزين ثم أعد المحاولة' };
    }
  }

  try {
    await prisma.specialistReport.create({
      data: {
        studentId: parsed.data.studentId,
        submittedByTeacherId: employeeId ?? 'unknown',
        content: parsed.data.content,
        fileUrl
      }
    });
  } catch (err) {
    console.error('submitSpecialistReport failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/social/protection-committee');
  return { success: true };
}

export async function deleteSpecialistReport(id: string) {
  if (!(await requirePermission('specialist_report.submit'))) return;
  await prisma.specialistReport.delete({ where: { id } });
  revalidatePath('/social/protection-committee');
}

const committeeSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  members: z.array(z.string()).optional(),
  finalOpinion: z.string().optional().or(z.literal(''))
});

export async function formProtectionCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('social.protection.manage'))) {
    return { error: 'ليس لديك صلاحية تشكيل اللجان' };
  }

  const parsed = committeeSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    members: formData.getAll('member').map(String).filter((v) => v.length > 0),
    finalOpinion: String(formData.get('finalOpinion') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.protectionCommittee.create({
      data: {
        studentId: parsed.data.studentId,
        memberIds: parsed.data.members ?? [],
        finalOpinion: parsed.data.finalOpinion || null,
        formedBy: session.user.id
      }
    });
  } catch (err) {
    console.error('formProtectionCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/social/protection-committee');
  return { success: true };
}

export async function decideProtectionCommittee(
  committeeId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('social.protection.manage'))) return { error: 'ليس لديك صلاحية' };

  const status = String(formData.get('status') ?? 'open');
  const finalOpinion = String(formData.get('finalOpinion') ?? '').trim();

  try {
    await prisma.protectionCommittee.update({
      where: { id: committeeId },
      data: { status, finalOpinion: finalOpinion || null }
    });
  } catch (err) {
    console.error('decideProtectionCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/social/protection-committee');
  return { success: true };
}

export async function deleteProtectionCommittee(id: string) {
  if (!(await requirePermission('social.protection.manage'))) return;
  await prisma.protectionCommittee.delete({ where: { id } });
  revalidatePath('/social/protection-committee');
}