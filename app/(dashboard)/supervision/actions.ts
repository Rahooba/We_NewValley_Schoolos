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
  scheduleId: z.string().min(1, 'اختر المشرف'),
  description: z.string().min(3, 'اكتب وصف النقطة')
});

export async function addPoint(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const isManager = permissions.includes('supervision.manage');

  const parsed = pointSchema.safeParse({
    scheduleId: String(formData.get('scheduleId') ?? ''),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const schedule = await prisma.supervisionSchedule.findUnique({
    where: { id: parsed.data.scheduleId },
    select: { employeeId: true, date: true }
  });
  if (!schedule) return { error: 'الجدول غير موجود' };

  // Only the supervisors assigned that day (or managers) may add points.
  const myEmployeeId = (session?.user as any)?.employeeId;
  const date = new Date(schedule.date);
  date.setHours(0, 0, 0, 0);
  const isAssignedToday =
    myEmployeeId &&
    (await prisma.supervisionSchedule.count({
      where: { employeeId: myEmployeeId, date: { gte: date, lt: new Date(date.getTime() + 86400000) } }
    })) > 0;

  if (!isManager && !isAssignedToday) return { error: 'لا يمكنك تسجيل نقاط — لست مشرفًا لهذا اليوم' };

  try {
    await prisma.supervisionPoint.create({
      data: { scheduleId: parsed.data.scheduleId, description: parsed.data.description }
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
