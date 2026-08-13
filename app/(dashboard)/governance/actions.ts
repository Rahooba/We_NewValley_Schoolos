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

// ---------------- Board members (board.manage) ----------------

const memberSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  schoolRole: z.string().min(2, 'الصفة مطلوبة'),
  order: z.string().optional().or(z.literal(''))
});

export async function addBoardMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('board.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = memberSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    schoolRole: String(formData.get('schoolRole') ?? '').trim(),
    order: String(formData.get('order') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.boardMember.create({
      data: {
        name: parsed.data.name,
        schoolRole: parsed.data.schoolRole,
        order: parsed.data.order ? Number(parsed.data.order) : null
      }
    });
  } catch (err) {
    console.error('addBoardMember failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/board');
  return { success: true };
}

export async function updateBoardMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('board.manage'))) return { error: 'ليس لديك صلاحية' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = memberSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    schoolRole: String(formData.get('schoolRole') ?? '').trim(),
    order: String(formData.get('order') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.boardMember.update({
      where: { id },
      data: {
        name: parsed.data.name,
        schoolRole: parsed.data.schoolRole,
        order: parsed.data.order ? Number(parsed.data.order) : null
      }
    });
  } catch (err) {
    console.error('updateBoardMember failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/board');
  return { success: true };
}

export async function deleteBoardMember(id: string) {
  if (!(await requirePermission('board.manage'))) return;
  await prisma.boardMember.delete({ where: { id } });
  revalidatePath('/governance/board');
}

// ---------------- Bylaw sections (board_instructions / internal_bylaw / discipline_bylaw) ----------------

export async function saveBylawSection(
  section: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requirePermission('board.manage'))) return { error: 'ليس لديك صلاحية' };

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  if (!title || !content) return { error: 'العنوان والمحتوى مطلوبان' };

  const session = await auth();
  const updatedBy = session?.user?.id ?? 'unknown';

  try {
    const existing = await prisma.schoolBylaw.findFirst({ where: { section } });
    if (existing) {
      await prisma.schoolBylaw.update({
        where: { id: existing.id },
        data: { title, content, updatedBy }
      });
    } else {
      await prisma.schoolBylaw.create({ data: { section, title, content, updatedBy } });
    }
  } catch (err) {
    console.error('saveBylawSection failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/board');
  revalidatePath('/discipline-bylaw');
  return { success: true };
}

// ---------------- Admin notices (notices.manage) ----------------

const noticeSchema = z.object({
  content: z.string().min(2, 'اكتب نص الإعلان')
});

export async function createNotice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !(await requirePermission('notices.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = noticeSchema.safeParse({
    content: String(formData.get('content') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.adminNotice.create({ data: { content: parsed.data.content, createdBy: session.user.id } });

      const activeUsers = await tx.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });

      for (const u of activeUsers) {
        await tx.notification.create({
          data: {
            userId: u.id,
            title: 'إعلان إداري جديد',
            message: parsed.data.content
          }
        });
      }
    });
  } catch (err) {
    console.error('createNotice failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/governance/notices');
  revalidatePath('/professional-transformation/camps');
  revalidatePath('/professional-transformation/projects');
  revalidatePath('/professional-transformation/competitions');
  return { success: true };
}

export async function deleteNotice(id: string) {
  if (!(await requirePermission('notices.manage'))) return;
  await prisma.adminNotice.delete({ where: { id } });
  revalidatePath('/governance/notices');
}

// ---------------- Communication groups (board.manage) ----------------

const groupSchema = z.object({
  name: z.string().min(2, 'اسم المجموعة مطلوب'),
  platform: z.string().min(1, 'اختر المنصة'),
  link: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal(''))
});

export async function addGroup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('board.manage'))) return { error: 'ليس لديك صلاحية' };

  const parsed = groupSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    platform: String(formData.get('platform') ?? ''),
    link: String(formData.get('link') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.communicationGroup.create({
      data: {
        name: parsed.data.name,
        platform: parsed.data.platform,
        link: parsed.data.link || null,
        description: parsed.data.description || null
      }
    });
  } catch (err) {
    console.error('addGroup failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/contact');
  return { success: true };
}

export async function deleteGroup(id: string) {
  if (!(await requirePermission('board.manage'))) return;
  await prisma.communicationGroup.delete({ where: { id } });
  revalidatePath('/contact');
}