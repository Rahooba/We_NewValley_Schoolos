'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { AttendanceStatus } from '@/generated/prisma/client';

export type ActionState = { error?: string; success?: boolean };

const VALID_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

// Returns the start of "today" so every attendance record for the same
// calendar day maps to the same @@unique([studentId, date]) row.
function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function markStudentAttendance(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('attendance.students.manage')) {
    return { error: 'ليس لديك صلاحية تسجيل الحضور' };
  }

  const date = today();
  const studentIds = formData.getAll('studentId') as string[];

  try {
    await prisma.$transaction(
      studentIds.map((studentId) => {
        const status = String(formData.get(`status_${studentId}`) ?? '') as AttendanceStatus;
        const note = String(formData.get(`note_${studentId}`) ?? '').trim();
        const safeStatus = VALID_STATUSES.includes(status) ? status : 'PRESENT';
        return prisma.studentAttendance.upsert({
          where: { studentId_date: { studentId, date } },
          update: { status: safeStatus, note: note || null },
          create: { studentId, date, status: safeStatus, note: note || null }
        });
      })
    );
  } catch (err) {
    console.error('markStudentAttendance failed', err);
    return { error: 'حدث خطأ أثناء حفظ الحضور' };
  }

  revalidatePath('/attendance/students');
  revalidatePath('/attendance/students/present');
  revalidatePath('/attendance/students/absent');
  revalidatePath('/dashboard');
  return { success: true };
}
