'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadPrivateFile } from '@/lib/blob-upload';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

const supervisionSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  employeeId: z.string().min(1, 'اختر المشرف'),
  area: z.string().optional().or(z.literal('')),
  isGeneralSupervisor: z.boolean().optional()
});

export async function createSupervision(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('supervision.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = supervisionSchema.safeParse({
    date: String(formData.get('date') ?? ''),
    employeeId: String(formData.get('employeeId') ?? ''),
    area: String(formData.get('area') ?? '').trim(),
    isGeneralSupervisor: formData.get('isGeneralSupervisor') === 'on'
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const date = new Date(`${parsed.data.date}T00:00:00`);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  // At most one general supervisor per day.
  if (parsed.data.isGeneralSupervisor) {
    const existing = await prisma.supervisionSchedule.findFirst({
      where: { date: { gte: date, lt: end }, isGeneralSupervisor: true }
    });
    if (existing) return { error: 'يوجد مشرف عام مسجل لهذا اليوم بالفعل' };
  }

  try {
    await prisma.supervisionSchedule.create({
      data: {
        date,
        employeeId: parsed.data.employeeId,
        area: parsed.data.area || null,
        isGeneralSupervisor: parsed.data.isGeneralSupervisor
      }
    });
  } catch (err) {
    console.error('createSupervision failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/supervision');
  return { success: true };
}

export async function deleteSupervision(id: string) {
  if (!(await requirePermission('supervision.manage'))) return;
  await prisma.supervisionSchedule.delete({ where: { id } });
  revalidatePath('/supervision');
}

const pointSchema = z.object({
  employeeId: z.string().min(1, 'اختر المشرف'),
  date: z.string().min(1, 'التاريخ مطلوب').regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional().or(z.literal(''))
});

export async function addPoint(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const isManager = permissions.includes('supervision.manage');

  const file = formData.get('file') as File | null;
  const hasFile = !!file && file.size > 0;

  const parsed = pointSchema.safeParse({
    employeeId: String(formData.get('employeeId') ?? ''),
    date: String(formData.get('date') ?? ''),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  if (!parsed.data.description && !hasFile) {
    return { error: 'اكتب وصف النقطة أو ارفق ملفًا' };
  }
  if (hasFile && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    return { error: 'يجب رفع ملف بصيغة PDF' };
  }

  const date = new Date(`${parsed.data.date}T00:00:00`);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  // Find or create schedule for this employee on this date.
  let schedule = await prisma.supervisionSchedule.findFirst({
    where: { employeeId: parsed.data.employeeId, date: { gte: date, lt: end } },
    select: { id: true, employeeId: true, date: true }
  });
  if (!schedule) {
    schedule = await prisma.supervisionSchedule.create({
      data: { employeeId: parsed.data.employeeId, date },
      select: { id: true, employeeId: true, date: true }
    });
  }

  // Only the supervisors assigned that day (or managers) may add points.
  const myEmployeeId = (session?.user as any)?.employeeId;
  const isAssignedToday =
    myEmployeeId &&
    (await prisma.supervisionSchedule.count({
      where: { employeeId: myEmployeeId, date: { gte: date, lt: end } }
    })) > 0;

  if (!isManager && !isAssignedToday) return { error: 'لا يمكنك تسجيل نقاط — لست مشرفًا لهذا اليوم' };

  let fileUrl: string | null = null;
  if (hasFile) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    try {
      const blob = await uploadPrivateFile(
        `supervision/${schedule.id}-${Date.now()}-${safeName}`,
        file,
        { contentType: 'application/pdf' }
      );
      fileUrl = blob.url;
    } catch (err) {
      console.error('addPoint upload failed', err);
      return {
        error: `فشل رفع الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`
      };
    }
  }

  try {
    await prisma.supervisionPoint.create({
      data: {
        scheduleId: schedule.id,
        description: parsed.data.description ?? '',
        fileUrl
      }
    });
  } catch (err) {
    console.error('addPoint failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/supervision');
  return { success: true };
}

export async function resolvePoint(pointId: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const isManager = permissions.includes('supervision.manage');
  const myEmployeeId = (session?.user as any)?.employeeId;

  const point = await prisma.supervisionPoint.findUnique({
    where: { id: pointId },
    include: { schedule: { select: { employeeId: true } } }
  });
  if (!point) return;
  if (!isManager && point.schedule.employeeId !== myEmployeeId) return;

  await prisma.supervisionPoint.update({
    where: { id: pointId },
    data: { status: 'resolved' }
  });
  revalidatePath('/supervision');
}
