'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MAX_SLOT_SCORE } from '@/lib/examSlots';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

const examSchema = z.object({
  name: z.string().min(2, 'اسم الامتحان مطلوب'),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  gradeLevel: z.string().optional().nullable()
});

function parseGradeLevel(raw: string | null | undefined): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 3 ? n : null;
}

export async function createExam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إضافة امتحان' };

  const parsed = examSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    startDate: String(formData.get('startDate') ?? ''),
    endDate: String(formData.get('endDate') ?? ''),
    gradeLevel: formData.get('gradeLevel')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.exam.create({
      data: {
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        gradeLevel: parseGradeLevel(parsed.data.gradeLevel)
      }
    });
  } catch (err) {
    console.error('createExam failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/exams');
  revalidatePath('/exams/grade');
  redirect('/exams');
}

// ---------------- Exam edit/delete ----------------

export async function updateExam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية تعديل الامتحان' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = examSchema.safeParse({
    name: String(formData.get('name') ?? '').trim(),
    startDate: String(formData.get('startDate') ?? ''),
    endDate: String(formData.get('endDate') ?? ''),
    gradeLevel: null
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.exam.update({
      where: { id },
      data: {
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate)
      }
    });
  } catch (err) {
    console.error('updateExam failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/exams');
  return { success: true };
}

const markSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  subject: z.string().min(1, 'المادة مطلوبة'),
  score: z.string().min(1, 'الدرجة مطلوبة'),
  maxScore: z.string().min(1, 'الدرجة الكلية مطلوبة')
});

export async function saveMark(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = markSchema.safeParse({
    examId: String(formData.get('examId') ?? ''),
    studentId: String(formData.get('studentId') ?? ''),
    subject: String(formData.get('subject') ?? '').trim(),
    score: String(formData.get('score') ?? ''),
    maxScore: String(formData.get('maxScore') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.mark.upsert({
      where: {
        examId_studentId_subject: {
          examId: parsed.data.examId,
          studentId: parsed.data.studentId,
          subject: parsed.data.subject
        }
      },
      update: { score: Number(parsed.data.score), maxScore: Number(parsed.data.maxScore) },
      create: {
        examId: parsed.data.examId,
        studentId: parsed.data.studentId,
        subject: parsed.data.subject,
        score: Number(parsed.data.score),
        maxScore: Number(parsed.data.maxScore)
      }
    });
  } catch (err) {
    console.error('saveMark failed', err);
    return { error: 'حدث خطأ أثناء حفظ الدرجة' };
  }

  revalidatePath(`/exams/${parsed.data.examId}`);
  return { success: true };
}

export async function deleteExam(id: string) {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return;
  await prisma.exam.delete({ where: { id } });
  revalidatePath('/exams');
}

// ---------------- Exam committees ----------------

const committeeSchema = z.object({
  examId: z.string().min(1, 'اختر الامتحان'),
  room: z.string().min(1, 'رقم القاعة مطلوب'),
  members: z.string().optional()
});

export async function addCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة اللجان' };

  const parsed = committeeSchema.safeParse({
    examId: String(formData.get('examId') ?? ''),
    room: String(formData.get('room') ?? '').trim(),
    members: String(formData.get('members') ?? '').trim() || undefined
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.examCommittee.create({ data: parsed.data });
  } catch (err) {
    console.error('addCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath(`/exams/${parsed.data.examId}`);
  return { success: true };
}

export async function updateCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة اللجان' };

  const id = String(formData.get('id') ?? '');
  const examId = String(formData.get('examId') ?? '');
  const room = String(formData.get('room') ?? '').trim();
  const members = String(formData.get('members') ?? '').trim();
  if (!id || !room) return { error: 'بيانات غير صحيحة' };

  try {
    await prisma.examCommittee.update({ where: { id }, data: { room, members } });
  } catch (err) {
    console.error('updateCommittee failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath(`/exams/${examId}`);
  return { success: true };
}

export async function deleteCommittee(id: string) {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return;
  const c = await prisma.examCommittee.findUnique({ where: { id } });
  if (!c) return;
  await prisma.examCommittee.delete({ where: { id } });
  revalidatePath(`/exams/${c.examId}`);
}

// ---------------- Mark delete ----------------

export async function deleteMark(id: string) {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return;
  const m = await prisma.mark.findUnique({ where: { id } });
  if (!m) return;
  await prisma.mark.delete({ where: { id } });
  revalidatePath(`/exams/${m.examId}`);
}

// ---------------- Slot marks (exams restructuring) ----------------

export async function saveSlotMarks(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const gradeLevel = Number(formData.get('gradeLevel') ?? 0);
  const className = String(formData.get('className') ?? '').trim();
  const slot = String(formData.get('slot') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const maxScore = Math.max(1, Number(formData.get('maxScore') ?? MAX_SLOT_SCORE));
  if (![1, 2, 3].includes(gradeLevel) || !className || !slot || !subject) {
    return { error: 'بيانات غير صحيحة' };
  }

  const scores = new Map<string, number>();
  for (const [rawKey, rawValue] of formData.entries()) {
    if (!rawKey.startsWith('score_')) continue;
    const studentId = rawKey.slice('score_'.length);
    const score = Number(rawValue);
    if (!studentId || Number.isNaN(score)) continue;
    const clamped = Math.max(0, Math.min(maxScore, score));
    scores.set(studentId, clamped);
  }

  const classRow = await prisma.class.findFirst({ where: { name: className } });
  if (!classRow) return { error: 'الفصل غير موجود' };
  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE', classId: classRow.id },
    select: { id: true }
  });

  try {
    const existing = await prisma.formativeAssessment.findMany({
      where: { gradeLevel, className, slot },
      select: { id: true, studentId: true }
    });
    const existingMap = new Map(existing.map((a) => [a.studentId, a.id]));

    for (const s of students) {
      const score = scores.get(s.id);
      if (score === undefined) continue;
      const prevId = existingMap.get(s.id);
      const data = {
        studentId: s.id,
        subject,
        score: score,
        maxScore: maxScore,
        gradeLevel,
        className,
        slot
      };
      if (prevId) {
        await prisma.formativeAssessment.update({ where: { id: prevId }, data });
      } else {
        await prisma.formativeAssessment.create({ data });
      }
    }
  } catch (err) {
    console.error('saveSlotMarks failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath(`/exams/grade/${gradeLevel}`);
  revalidatePath(`/exams/grade/${gradeLevel}/slot`);
  revalidatePath('/exams');
  return { success: true };
}

// ---------------- Results compute ----------------

export async function computeResults(examId: string) {
  const allowed = await requirePermission('exams.manage');
  if (!allowed) return;

  const [marks, existingResults] = await Promise.all([
    prisma.mark.findMany({ where: { examId } }),
    prisma.result.findMany({ where: { examId } })
  ]);

  const byStudent = new Map<string, { total: number; max: number }>();
  for (const m of marks) {
    const s = Number(m.score);
    const mx = Number(m.maxScore);
    const cur = byStudent.get(m.studentId) ?? { total: 0, max: 0 };
    byStudent.set(m.studentId, { total: cur.total + s, max: cur.max + mx });
  }

  const computed = new Map(
    existingResults.map((r) => [
      r.studentId,
      { id: r.id, total: Number(r.total), average: Number(r.average), status: r.status }
    ])
  );

  for (const [studentId, { total, max }] of byStudent) {
    const average = max > 0 ? (total / max) * 100 : 0;
    const status = average >= 50 ? 'pass' : 'fail';
    const prev = computed.get(studentId);
    if (prev) {
      await prisma.result.update({
        where: { id: prev.id },
        data: { total, average, status }
      });
    } else {
      await prisma.result.create({ data: { examId, studentId, total, average, status } });
    }
  }

  revalidatePath(`/exams/${examId}`);
}
