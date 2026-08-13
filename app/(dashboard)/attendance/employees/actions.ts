'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AttendanceStatus } from '@/generated/prisma/client';

export type ActionState = { error?: string; success?: boolean };

const VALID_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function markEmployeeAttendance(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('attendance.employees.manage')) {
    return { error: 'ليس لديك صلاحية تسجيل الحضور' };
  }

  const date = today();
  const employeeIds = formData.getAll('employeeId') as string[];

  try {
    await prisma.$transaction(
      employeeIds.map((employeeId) => {
        const status = String(formData.get(`status_${employeeId}`) ?? '') as AttendanceStatus;
        const safeStatus = VALID_STATUSES.includes(status) ? status : 'PRESENT';
        return prisma.employeeAttendance.upsert({
          where: { employeeId_date: { employeeId, date } },
          update: { status: safeStatus },
          create: { employeeId, date, status: safeStatus }
        });
      })
    );
  } catch (err) {
    console.error('markEmployeeAttendance failed', err);
    return { error: 'حدث خطأ أثناء حفظ الحضور' };
  }

  revalidatePath('/attendance/employees');
  revalidatePath('/attendance/employees/present');
  revalidatePath('/attendance/employees/absent');
  revalidatePath('/dashboard');
  return { success: true };
}
