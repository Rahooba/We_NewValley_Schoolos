'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

const TYPES = ['positive', 'negative', 'tardiness'] as const;

async function canManage(): Promise<boolean> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes('attendance.late.manage');
}

const studentBehaviorSchema = z.object({
  studentId: z.string().min(1, 'اختر الطالب'),
  type: z.enum(TYPES),
  description: z.string().min(2, 'الوصف مطلوب')
});

export async function createStudentBehavior(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const ok = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية الرصد السلوكي' };

  const parsed = studentBehaviorSchema.safeParse({
    studentId: String(formData.get('studentId') ?? ''),
    type: String(formData.get('type') ?? ''),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.studentBehavior.create({
      data: {
        studentId: parsed.data.studentId,
        type: parsed.data.type,
        description: parsed.data.description,
        recordedBy: session!.user!.id
      }
    });
  } catch (err) {
    console.error('createStudentBehavior failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/professional-transformation');
  return { success: true };
}

const employeeBehaviorSchema = z.object({
  employeeId: z.string().min(1, 'اختر الموظف'),
  type: z.enum(TYPES),
  description: z.string().min(2, 'الوصف مطلوب')
});

export async function createEmployeeBehavior(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const ok = await canManage();
  if (!ok) return { error: 'ليس لديك صلاحية الرصد السلوكي' };

  const parsed = employeeBehaviorSchema.safeParse({
    employeeId: String(formData.get('employeeId') ?? ''),
    type: String(formData.get('type') ?? ''),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.employeeBehavior.create({
      data: {
        employeeId: parsed.data.employeeId,
        type: parsed.data.type,
        description: parsed.data.description,
        recordedBy: session!.user!.id
      }
    });
  } catch (err) {
    console.error('createEmployeeBehavior failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/professional-transformation');
  return { success: true };
}

export async function deleteStudentBehavior(id: string) {
  if (!(await canManage())) return;
  await prisma.studentBehavior.delete({ where: { id } });
  revalidatePath('/professional-transformation');
}

export async function deleteEmployeeBehavior(id: string) {
  if (!(await canManage())) return;
  await prisma.employeeBehavior.delete({ where: { id } });
  revalidatePath('/professional-transformation');
}
