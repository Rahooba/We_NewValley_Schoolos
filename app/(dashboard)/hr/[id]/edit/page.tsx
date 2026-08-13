import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmployeeForm, type EditEmployeeValues } from '../../new/EmployeeForm';
import { EmployeeSections } from '../../EmployeeSections';

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('hr.edit')) {
    redirect('/dashboard/forbidden');
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      contracts: { orderBy: { startDate: 'asc' } },
      leaves: { orderBy: { startDate: 'desc' } },
      evaluations: { orderBy: { createdAt: 'desc' } }
    }
  });
  if (!employee) notFound();

  const firstContract = employee.contracts[0];
  const values: EditEmployeeValues = {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    position: employee.position,
    department: employee.department,
    employmentCategory: employee.employmentCategory ?? 'contract',
    status: employee.status,
    contractStart: firstContract ? firstContract.startDate.toISOString().slice(0, 10) : null,
    salary: firstContract ? String(Number(firstContract.salary)) : null,
    contractType: firstContract?.type ?? null
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">تعديل موظف — {employee.fullName}</h1>
        <p className="text-sm text-muted">تعديل البيانات الأساسية وإدارة العقود والإجازات والتقيمات</p>
      </div>
      <EmployeeForm employee={values} />
      <EmployeeSections
        employeeId={employee.id}
        contracts={employee.contracts}
        leaves={employee.leaves}
        evaluations={employee.evaluations}
        employmentCategory={employee.employmentCategory ?? 'contract'}
      />
    </div>
  );
}
