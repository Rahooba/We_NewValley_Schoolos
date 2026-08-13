import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentForm, type EditStudentValues } from '../../new/StudentForm';

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('students.edit')) {
    redirect('/dashboard/forbidden');
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: { parents: true }
  });
  if (!student) notFound();

  const classes = await prisma.class.findMany({
    include: { sections: true },
    orderBy: { name: 'asc' }
  });

  const parent = student.parents[0];
  const values: EditStudentValues = {
    id: student.id,
    studentCode: student.studentCode,
    fullName: student.fullName,
    gender: student.gender,
    birthDate: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : null,
    classId: student.classId,
    sectionId: student.sectionId,
    track: student.track,
    parentName: parent?.fullName ?? null,
    parentPhone: parent?.phone ?? null
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">تعديل طالب — {student.fullName}</h1>
      <StudentForm classes={classes} student={values} />
    </div>
  );
}
