'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const studentSchema = z.object({
  studentCode: z.string().min(1, 'كود الطالب مطلوب'),
  fullName: z.string().min(3, 'الاسم مطلوب'),
  gender: z.enum(['ذكر', 'أنثى']).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  classId: z.string().optional().or(z.literal('')),
  sectionId: z.string().optional().or(z.literal('')),
  track: z.enum(['برمجة', 'شبكات', 'اتصالات']).optional().or(z.literal('')),
  parentName: z.string().optional().or(z.literal('')),
  parentPhone: z.string().optional().or(z.literal(''))
});

export type CreateStudentState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createStudent(
  _prevState: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  // Defense in depth: middleware guards the page route, but the action itself
  // must also verify the permission since actions can be invoked directly.
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('students.create')) {
    return { error: 'ليس لديك صلاحية إضافة طالب' };
  }

  const raw = {
    studentCode: String(formData.get('studentCode') ?? '').trim(),
    fullName: String(formData.get('fullName') ?? '').trim(),
    gender: String(formData.get('gender') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    classId: String(formData.get('classId') ?? ''),
    sectionId: String(formData.get('sectionId') ?? ''),
    track: String(formData.get('track') ?? ''),
    parentName: String(formData.get('parentName') ?? '').trim(),
    parentPhone: String(formData.get('parentPhone') ?? '').trim()
  };

  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: 'من فضلك راجع البيانات المدخلة', fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.student.findUnique({
    where: { studentCode: data.studentCode }
  });
  if (existing) {
    return {
      error: 'كود الطالب مستخدم بالفعل',
      fieldErrors: { studentCode: 'هذا الكود مستخدم من قبل' }
    };
  }

  try {
    await prisma.student.create({
      data: {
        studentCode: data.studentCode,
        fullName: data.fullName,
        gender: data.gender || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        classId: data.classId || null,
        sectionId: data.sectionId || null,
        track: data.track || null,
        status: 'ACTIVE',
        ...(data.parentName
          ? {
              parents: {
                create: [
                  {
                    fullName: data.parentName,
                    phone: data.parentPhone || null,
                    relation: 'ولي أمر'
                  }
                ]
              }
            }
          : {})
      }
    });
  } catch (err) {
    console.error('createStudent failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى' };
  }

  // NOTE: there is no /students/[id] detail page yet, so we return to the
  // list page. Once a detail page is built, redirect there instead.
  revalidatePath('/students');
  redirect('/students');
}

export type UpdateStudentState = CreateStudentState;

export async function updateStudent(
  _prevState: UpdateStudentState,
  formData: FormData
): Promise<UpdateStudentState> {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('students.edit')) {
    return { error: 'ليس لديك صلاحية تعديل طالب' };
  }

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'بيانات الطالب غير صحيحة' };

  const raw = {
    studentCode: String(formData.get('studentCode') ?? '').trim(),
    fullName: String(formData.get('fullName') ?? '').trim(),
    gender: String(formData.get('gender') ?? ''),
    birthDate: String(formData.get('birthDate') ?? ''),
    classId: String(formData.get('classId') ?? ''),
    sectionId: String(formData.get('sectionId') ?? ''),
    track: String(formData.get('track') ?? ''),
    parentName: String(formData.get('parentName') ?? '').trim(),
    parentPhone: String(formData.get('parentPhone') ?? '').trim()
  };

  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: 'من فضلك راجع البيانات المدخلة', fieldErrors };
  }

  const data = parsed.data;
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return { error: 'الطالب غير موجود' };

  const codeConflict = await prisma.student.findFirst({
    where: { studentCode: data.studentCode, id: { not: id } }
  });
  if (codeConflict) {
    return {
      error: 'كود الطالب مستخدم بالفعل',
      fieldErrors: { studentCode: 'هذا الكود مستخدم من قبل' }
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: {
          studentCode: data.studentCode,
          fullName: data.fullName,
          gender: data.gender || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          classId: data.classId || null,
          sectionId: data.sectionId || null,
          track: data.track || null
        }
      });

      const parents = await tx.parent.findMany({ where: { studentId: id }, orderBy: { id: 'asc' } });
      if (data.parentName) {
        if (parents[0]) {
          await tx.parent.update({
            where: { id: parents[0].id },
            data: { fullName: data.parentName, phone: data.parentPhone || null }
          });
        } else {
          await tx.parent.create({
            data: {
              studentId: id,
              fullName: data.parentName,
              phone: data.parentPhone || null,
              relation: 'ولي أمر'
            }
          });
        }
      } else if (parents.length > 0) {
        await tx.parent.deleteMany({ where: { studentId: id } });
      }
    });
  } catch (err) {
    console.error('updateStudent failed', err);
    return { error: 'حدث خطأ أثناء الحفظ، حاول مرة أخرى' };
  }

  revalidatePath('/students');
  redirect('/students');
}

export async function deleteStudent(id: string) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!session || !permissions.includes('students.delete')) {
    return;
  }
  await prisma.student.delete({ where: { id } });
  revalidatePath('/students');
}
