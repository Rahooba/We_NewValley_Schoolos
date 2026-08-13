'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { uploadPrivateFile } from '@/lib/blob-upload';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isoWeek, isoWeekYear, mondayOfIsoWeek, sundayOfIsoWeek, toISODate } from '@/lib/weeks';

async function requirePermission(permission: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  return !!session && permissions.includes(permission);
}

export type ActionState = { error?: string; success?: boolean };

const subjectSchema = z.object({
  code: z.string().min(1, 'كود المادة مطلوب'),
  name: z.string().min(2, 'اسم المادة مطلوب')
});

export async function createSubject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('academics.view');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = subjectSchema.safeParse({
    code: String(formData.get('code') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const existing = await prisma.subject.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: 'كود المادة مستخدم بالفعل' };

  try {
    await prisma.subject.create({ data: parsed.data });
  } catch (err) {
    console.error('createSubject failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return {};
}

// Assigning a lesson-plan deadline is done by the academic director/admin —
// it just reserves a slot (subject + teacher + due date), no file yet.
const lessonPlanAssignSchema = z.object({
  subjectId: z.string().min(1, 'اختر المادة'),
  teacherId: z.string().min(1, 'اختر المعلم'),
  title: z.string().min(2, 'عنوان الخطة مطلوب'),
  weekOf: z.string().min(1, 'حدد الأسبوع'),
  dueDate: z.string().min(1, 'حدد الموعد النهائي')
});

export async function createLessonPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية تحديد خطط الدروس' };

  const parsed = lessonPlanAssignSchema.safeParse({
    subjectId: String(formData.get('subjectId') ?? ''),
    teacherId: String(formData.get('teacherId') ?? ''),
    title: String(formData.get('title') ?? '').trim(),
    weekOf: String(formData.get('weekOf') ?? ''),
    dueDate: String(formData.get('dueDate') ?? '')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.lessonPlan.create({
      data: {
        subjectId: parsed.data.subjectId,
        teacherId: parsed.data.teacherId,
        title: parsed.data.title,
        weekOf: new Date(parsed.data.weekOf),
        dueDate: new Date(parsed.data.dueDate)
      }
    });
  } catch (err) {
    console.error('createLessonPlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return {};
}

// Teachers submit their own assigned plan (by id) — a file/title update on a
// row that already exists. They can only submit rows tied to their own
// employeeId, verified server-side regardless of what the form sends.
const lessonPlanSubmitSchema = z.object({
  lessonPlanId: z.string().min(1),
  fileUrl: z.string().min(1, 'أدخل رابط الملف')
});

export async function submitLessonPlan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const employeeId = (session?.user as any)?.employeeId as string | null | undefined;

  if (!session || !permissions.includes('lesson_plans.submit')) {
    return { error: 'ليس لديك صلاحية رفع خطة الدرس' };
  }
  if (!employeeId) {
    return { error: 'حسابك غير مرتبط بملف موظف، راجع مسئول النظام' };
  }

  const parsed = lessonPlanSubmitSchema.safeParse({
    lessonPlanId: String(formData.get('lessonPlanId') ?? ''),
    fileUrl: String(formData.get('fileUrl') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const plan = await prisma.lessonPlan.findUnique({ where: { id: parsed.data.lessonPlanId } });
  if (!plan || plan.teacherId !== employeeId) {
    return { error: 'هذه الخطة ليست مخصصة لك' };
  }

  try {
    await prisma.lessonPlan.update({
      where: { id: plan.id },
      data: { fileUrl: parsed.data.fileUrl, submittedAt: new Date() }
    });
  } catch (err) {
    console.error('submitLessonPlan failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return {};
}

// Teacher uploads their own plan PDF for a subject + week.
// If a plan already exists for (teacher, subject, week) it is re-uploaded
// (updated in place); otherwise a new plan row is created with a default
// due date at the end of that week (director can adjust it later).
const uploadLessonPlanSchema = z.object({
  subjectId: z.string().min(1, 'اختر المادة'),
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'اختر الأسبوع'),
  title: z.string().min(2, 'عنوان الخطة مطلوب')
});

export async function uploadLessonPlanFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const employeeId = (session?.user as any)?.employeeId as string | null | undefined;

  if (!session || !permissions.includes('lesson_plans.submit')) {
    return { error: 'ليس لديك صلاحية رفع خطة الدرس' };
  }
  if (!employeeId) {
    return { error: 'حسابك غير مرتبط بملف موظف، راجع مسئول النظام' };
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'يرجى اختيار ملف PDF' };
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    return { error: 'يجب رفع ملف بصيغة PDF' };
  }

  const parsed = uploadLessonPlanSchema.safeParse({
    subjectId: String(formData.get('subjectId') ?? ''),
    weekOf: String(formData.get('weekOf') ?? ''),
    title: String(formData.get('title') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const weekOf = new Date(`${parsed.data.weekOf}T00:00:00`);
  const weekYear = isoWeekYear(weekOf);
  const weekNumber = isoWeek(weekOf);
  const sunday = sundayOfIsoWeek(weekYear, weekNumber);
  const dueDate = new Date(sunday.getTime() + 86399000); // end of that week

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  try {
    const blob = await uploadPrivateFile(
      `lesson-plans/${parsed.data.weekOf}-${employeeId}-${Date.now()}-${safeName}`,
      file,
      { contentType: 'application/pdf' }
    );

    const existing = await prisma.lessonPlan.findFirst({
      where: { teacherId: employeeId, subjectId: parsed.data.subjectId, weekNumber }
    });

    if (existing) {
      await prisma.lessonPlan.update({
        where: { id: existing.id },
        data: { fileUrl: blob.url, title: parsed.data.title, submittedAt: new Date() }
      });
    } else {
      await prisma.lessonPlan.create({
        data: {
          subjectId: parsed.data.subjectId,
          teacherId: employeeId,
          title: parsed.data.title,
          fileUrl: blob.url,
          weekOf,
          weekNumber,
          dueDate,
          submittedAt: new Date()
        }
      });
    }
  } catch (err) {
    console.error('uploadLessonPlanFile failed', err);
    return {
      error: 'فشل رفع الملف. تأكد من إعداد التخزين (BLOB_READ_WRITE_TOKEN) ثم أعد المحاولة.'
    };
  }

  revalidatePath('/academics');
  revalidatePath('/academics/lesson-plans/overview');
  return { success: true };
}

// Director only: assign or edit the deadline for a teacher/subject/week.
const dueDateSchema = z.object({
  teacherId: z.string().min(1, 'اختر المعلم'),
  subjectId: z.string().min(1, 'اختر المادة'),
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'اختر الأسبوع'),
  dueDate: z.string().min(1, 'حدد الموعد النهائي'),
  title: z.string().min(2, 'عنوان الخطة مطلوب')
});

export async function setLessonPlanDueDate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية تحديد مواعيد خطط الدروس' };

  const parsed = dueDateSchema.safeParse({
    teacherId: String(formData.get('teacherId') ?? ''),
    subjectId: String(formData.get('subjectId') ?? ''),
    weekOf: String(formData.get('weekOf') ?? ''),
    dueDate: String(formData.get('dueDate') ?? ''),
    title: String(formData.get('title') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const weekOf = new Date(`${parsed.data.weekOf}T00:00:00`);
  const weekNumber = isoWeek(weekOf);

  try {
    const existing = await prisma.lessonPlan.findFirst({
      where: {
        teacherId: parsed.data.teacherId,
        subjectId: parsed.data.subjectId,
        weekNumber
      }
    });

    if (existing) {
      await prisma.lessonPlan.update({
        where: { id: existing.id },
        data: { dueDate: new Date(parsed.data.dueDate), title: parsed.data.title, weekOf }
      });
    } else {
      await prisma.lessonPlan.create({
        data: {
          subjectId: parsed.data.subjectId,
          teacherId: parsed.data.teacherId,
          title: parsed.data.title,
          weekOf,
          weekNumber,
          dueDate: new Date(parsed.data.dueDate)
        }
      });
    }
  } catch (err) {
    console.error('setLessonPlanDueDate failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }

  revalidatePath('/academics');
  revalidatePath('/academics/lesson-plans/overview');
  return {};
}

const scheduleSchema = z.object({
  teacherId: z.string().min(1, 'اختر المعلم'),
  day: z.string().min(1, 'اختر اليوم'),
  period: z.string().min(1, 'حدد الحصة'),
  subject: z.string().min(1, 'المادة مطلوبة'),
  className: z.string().min(1, 'الفصل مطلوب')
});

export async function createScheduleEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('academics.view');
  if (!allowed) return { error: 'ليس لديك صلاحية' };

  const parsed = scheduleSchema.safeParse({
    teacherId: String(formData.get('teacherId') ?? ''),
    day: String(formData.get('day') ?? ''),
    period: String(formData.get('period') ?? ''),
    subject: String(formData.get('subject') ?? '').trim(),
    className: String(formData.get('className') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.teacherSchedule.create({
      data: {
        teacherId: parsed.data.teacherId,
        day: parsed.data.day,
        period: Number(parsed.data.period),
        subject: parsed.data.subject,
        className: parsed.data.className
      }
    });
  } catch (err) {
    console.error('createScheduleEntry failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return {};
}

// ---------------- Subject edit/delete ----------------

export async function updateSubject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة المواد' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات غير صحيحة' };

  const parsed = subjectSchema.safeParse({
    code: String(formData.get('code') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const conflict = await prisma.subject.findFirst({
    where: { code: parsed.data.code, id: { not: id } }
  });
  if (conflict) return { error: 'كود المادة مستخدم بالفعل' };

  try {
    await prisma.subject.update({ where: { id }, data: parsed.data });
  } catch (err) {
    console.error('updateSubject failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function deleteSubject(id: string) {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return;
  await prisma.subject.delete({ where: { id } });
  revalidatePath('/academics');
}

// ---------------- Schedule edit/delete ----------------

const scheduleEditSchema = z.object({
  id: z.string().min(1),
  day: z.string().min(1, 'اختر اليوم'),
  period: z.string().min(1, 'حدد الحصة'),
  subject: z.string().min(1, 'المادة مطلوبة'),
  className: z.string().min(1, 'الفصل مطلوب')
});

export async function updateScheduleEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية تعديل الجدول' };

  const parsed = scheduleEditSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    day: String(formData.get('day') ?? ''),
    period: String(formData.get('period') ?? ''),
    subject: String(formData.get('subject') ?? '').trim(),
    className: String(formData.get('className') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  try {
    await prisma.teacherSchedule.update({
      where: { id: parsed.data.id },
      data: {
        day: parsed.data.day,
        period: Number(parsed.data.period),
        subject: parsed.data.subject,
        className: parsed.data.className
      }
    });
  } catch (err) {
    console.error('updateScheduleEntry failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function deleteScheduleEntry(id: string) {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return;
  await prisma.teacherSchedule.delete({ where: { id } });
  revalidatePath('/academics');
}

// ---------------- Lesson plan delete ----------------

export async function deleteLessonPlan(id: string) {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return;
  await prisma.lessonPlan.delete({ where: { id } });
  revalidatePath('/academics');
  revalidatePath('/academics/lesson-plans/overview');
}

// ---------------- Classes & Sections ----------------

const classSchema = z.object({
  name: z.string().min(2, 'اسم الصف مطلوب')
});

export async function createClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة الصفوف' };

  const parsed = classSchema.safeParse({ name: String(formData.get('name') ?? '').trim() });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const exists = await prisma.class.findFirst({ where: { name: parsed.data.name } });
  if (exists) return { error: 'يوجد صف بهذا الاسم بالفعل' };

  try {
    await prisma.class.create({ data: parsed.data });
  } catch (err) {
    console.error('createClass failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function updateClass(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة الصفوف' };

  const id = String(formData.get('id') ?? '');
  const parsed = classSchema.safeParse({ name: String(formData.get('name') ?? '').trim() });
  if (!id || !parsed.success) return { error: 'بيانات غير صحيحة' };

  const conflict = await prisma.class.findFirst({ where: { name: parsed.data.name, id: { not: id } } });
  if (conflict) return { error: 'يوجد صف بهذا الاسم بالفعل' };

  try {
    await prisma.class.update({ where: { id }, data: parsed.data });
  } catch (err) {
    console.error('updateClass failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function deleteClass(id: string) {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return;
  await prisma.$transaction([
    prisma.student.updateMany({ where: { classId: id }, data: { classId: null } }),
    prisma.student.updateMany({ where: { sectionId: { in: (await prisma.section.findMany({ where: { classId: id } })).map((s) => s.id) } }, data: { sectionId: null } }),
    prisma.section.deleteMany({ where: { classId: id } }),
    prisma.class.delete({ where: { id } })
  ]);
  revalidatePath('/academics');
}

const sectionSchema = z.object({
  classId: z.string().min(1, 'اختر الصف'),
  name: z.string().min(1, 'اسم الفصل مطلوب')
});

export async function createSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة الفصول' };

  const parsed = sectionSchema.safeParse({
    classId: String(formData.get('classId') ?? ''),
    name: String(formData.get('name') ?? '').trim()
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة' };

  const exists = await prisma.section.findFirst({
    where: { classId: parsed.data.classId, name: parsed.data.name }
  });
  if (exists) return { error: 'يوجد فصل بهذا الاسم في الصف بالفعل' };

  try {
    await prisma.section.create({ data: parsed.data });
  } catch (err) {
    console.error('createSection failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function updateSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return { error: 'ليس لديك صلاحية إدارة الفصول' };

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) return { error: 'بيانات غير صحيحة' };

  try {
    await prisma.section.update({ where: { id }, data: { name } });
  } catch (err) {
    console.error('updateSection failed', err);
    return { error: 'حدث خطأ أثناء الحفظ' };
  }
  revalidatePath('/academics');
  return { success: true };
}

export async function deleteSection(id: string) {
  const allowed = await requirePermission('lesson_plans.manage');
  if (!allowed) return;
  await prisma.$transaction([
    prisma.student.updateMany({ where: { sectionId: id }, data: { sectionId: null } }),
    prisma.section.delete({ where: { id } })
  ]);
  revalidatePath('/academics');
}
