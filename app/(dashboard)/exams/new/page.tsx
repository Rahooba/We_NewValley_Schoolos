import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ExamForm } from './ExamForm';

export default async function NewExamPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('exams.manage')) {
    redirect('/dashboard/forbidden');
  }

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">إضافة امتحان جديد</h1>
      <ExamForm />
    </div>
  );
}
