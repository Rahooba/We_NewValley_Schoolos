import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { EmployeeForm } from './EmployeeForm';

export default async function NewEmployeePage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('hr.create')) {
    redirect('/dashboard/forbidden');
  }

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">إضافة موظف جديد</h1>
      <EmployeeForm />
    </div>
  );
}
