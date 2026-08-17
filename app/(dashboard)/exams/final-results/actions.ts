'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { error?: string; success?: boolean };

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export async function saveFinalMarks(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requirePermission('exams.manage'))) return { error: 'ليس لديك صلاحية' };

  const examId = String(formData.get('examId') ?? '').trim();
  const subjectId = String(formData.get('subjectId') ?? '').trim();
  const subjectName = String(formData.get('subjectName') ?? '').trim();
  const maxScore = Number(formData.get('maxScore') ?? '');

  if (!examId || !subjectId || !subjectName) return { error: 'بيانات غير صحيحة' };
  // The max score is entered by the Executive Director per subject-session —
  // required, never assumed, never defaulted to 100.
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return { error: 'أدخل درجة المادة الكلية أولاً (أكبر من صفر)' };
  }

  const scores = new Map<string, number>();
  for (const [rawKey, rawValue] of formData.entries()) {
    if (!rawKey.startsWith('score_')) continue;
    const studentId = rawKey.slice('score_'.length);
    const score = Number(rawValue);
    if (!studentId || Number.isNaN(score)) continue;
    scores.set(studentId, Math.max(0, Math.min(maxScore, score)));
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
  if (!exam) return { error: 'الامتحان غير موجود' };

  try {
    const existing = await prisma.mark.findMany({
      where: { examId, subject: subjectName },
      select: { id: true, studentId: true }
    });
    const existingMap = new Map(existing.map((m) => [m.studentId, m.id]));

    for (const [studentId, score] of scores) {
      const prevId = existingMap.get(studentId);
      const data = { examId, studentId, subject: subjectName, score, maxScore };
      if (prevId) {
        await prisma.mark.update({ where: { id: prevId }, data });
      } else {
        await prisma.mark.create({ data });
      }
    }
  } catch (err) {
    console.error('saveFinalMarks failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath(`/exams/final-results/${subjectId}`);
  revalidatePath(`/exams/${examId}`);
  revalidatePath('/exams');
  return { success: true };
}