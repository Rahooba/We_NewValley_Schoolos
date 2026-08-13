import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentForm } from './StudentForm';

export default async function NewStudentPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('students.create')) {
    redirect('/dashboard/forbidden');
  }

  const classes = await prisma.class.findMany({
    include: { sections: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">إضافة طالب جديد</h1>
      <StudentForm classes={classes} />
    </div>
  );
}
