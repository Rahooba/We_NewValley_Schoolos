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

export async function createCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    name: z.string().min(2, 'اسم اللجنة مطلوب'),
    purpose: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.committee.create({ data: { name: parsed.data.name, purpose: parsed.data.purpose || null } });
  } catch (err) {
    console.error('createCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return {};
}

export async function addMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    committeeId: z.string().min(1, 'اختر اللجنة'),
    fullName: z.string().min(2, 'اسم العضو مطلوب'),
    role: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    committeeId: String(formData.get('committeeId') ?? ''),
    fullName: String(formData.get('fullName') ?? '').trim(),
    role: String(formData.get('role') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.committeeMember.create({
      data: { committeeId: parsed.data.committeeId, fullName: parsed.data.fullName, role: parsed.data.role || null }
    });
  } catch (err) {
    console.error('addMember failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return {};
}

export async function scheduleMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };
  const schema = z.object({
    committeeId: z.string().min(1, 'اختر اللجنة'),
    date: z.string().min(1, 'التاريخ مطلوب'),
    agenda: z.string().optional().or(z.literal(''))
  });
  const parsed = schema.safeParse({
    committeeId: String(formData.get('committeeId') ?? ''),
    date: String(formData.get('date') ?? ''),
    agenda: String(formData.get('agenda') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };
  try {
    await prisma.meeting.create({
      data: { committeeId: parsed.data.committeeId, date: new Date(parsed.data.date), agenda: parsed.data.agenda || null }
    });
  } catch (err) {
    console.error('scheduleMeeting failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return {};
}

// ---------------- Committee edit/delete ----------------

const committeeSchema = z.object({
  name: z.string().min(2, 'اسم اللجنة مطلوب'),
  purpose: z.string().optional().or(z.literal(''))
});

export async function updateCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = committeeSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    purpose: String(formData.get('purpose') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.committee.update({
      where: { id },
      data: { name: parsed.data.name, purpose: parsed.data.purpose || null }
    });
  } catch (err) {
    console.error('updateCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return { success: true };
}

export async function deleteCommittee(id: string) {
  if (!(await requirePermission('committees.manage'))) return;
  await prisma.committee.delete({ where: { id } });
  revalidatePath('/committees');
}

// ---------------- Member edit/delete ----------------

const memberSchema = z.object({
  fullName: z.string().min(2, 'اسم العضو مطلوب'),
  role: z.string().optional().or(z.literal(''))
});

export async function updateMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = memberSchema.safeParse({
    fullName: String(formData.get('fullName') ?? '').trim(),
    role: String(formData.get('role') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.committeeMember.update({
      where: { id },
      data: { fullName: parsed.data.fullName, role: parsed.data.role || null }
    });
  } catch (err) {
    console.error('updateMember failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return { success: true };
}

export async function deleteMember(id: string) {
  if (!(await requirePermission('committees.manage'))) return;
  await prisma.committeeMember.delete({ where: { id } });
  revalidatePath('/committees');
}

// ---------------- Meeting edit/delete ----------------

const meetingSchema = z.object({
  committeeId: z.string().min(1, 'اختر اللجنة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  agenda: z.string().optional().or(z.literal(''))
});

export async function updateMeeting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = meetingSchema.safeParse({
    committeeId: String(formData.get('committeeId') ?? ''),
    date: String(formData.get('date') ?? ''),
    agenda: String(formData.get('agenda') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.meeting.update({
      where: { id },
      data: {
        date: new Date(parsed.data.date),
        agenda: parsed.data.agenda || null
      }
    });
  } catch (err) {
    console.error('updateMeeting failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return { success: true };
}

export async function deleteMeeting(id: string) {
  if (!(await requirePermission('committees.manage'))) return;
  await prisma.meeting.delete({ where: { id } });
  revalidatePath('/committees');
}

// ---------------- Task CRUD ----------------

const taskSchema = z.object({
  meetingId: z.string().min(1, 'اختر الاجتماع'),
  title: z.string().min(2, 'عنوان المهمة مطلوب'),
  assignee: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal(''))
});

export async function addTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = taskSchema.safeParse({
    meetingId: String(formData.get('meetingId') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    assignee: String(formData.get('assignee') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    status: String(formData.get('status') ?? 'open')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.task.create({
      data: {
        meetingId: parsed.data.meetingId,
        title: parsed.data.title,
        assignee: parsed.data.assignee || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status || 'open'
      }
    });
  } catch (err) {
    console.error('addTask failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return { success: true };
}

export async function updateTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('committees.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = taskSchema.safeParse({
    meetingId: String(formData.get('meetingId') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    assignee: String(formData.get('assignee') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    status: String(formData.get('status') ?? 'open')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.task.update({
      where: { id },
      data: {
        title: parsed.data.title,
        assignee: parsed.data.assignee || null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status || 'open'
      }
    });
  } catch (err) {
    console.error('updateTask failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/committees');
  return { success: true };
}

export async function deleteTask(id: string) {
  if (!(await requirePermission('committees.manage'))) return;
  await prisma.task.delete({ where: { id } });
  revalidatePath('/committees');
}
