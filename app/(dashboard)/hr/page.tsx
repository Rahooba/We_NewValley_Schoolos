import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PermissionGate } from '@/components/PermissionGate';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { deleteEmployee } from './actions';

const PAGE_SIZE = 25;

export default async function HRPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canEdit = permissions.includes('hr.edit');
  const canDelete = permissions.includes('hr.delete');
  const showActions = canEdit || canDelete;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      include: { contracts: { orderBy: { startDate: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.employee.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">شئون العاملين</h1>
        <PermissionGate permission="hr.create">
          <Link href="/hr/new" className="btn-primary">
            <Plus size={16} />
            إضافة موظف
          </Link>
        </PermissionGate>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-3 font-medium">الكود</th>
                <th className="px-4 py-3 font-medium">الاسم</th>
                <th className="px-4 py-3 font-medium">الوظيفة</th>
                <th className="px-4 py-3 font-medium">القسم</th>
                <th className="px-4 py-3 font-medium">المرتب</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                {showActions && <th className="px-4 py-3 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="px-4 py-10 text-center text-muted">
                    لا يوجد موظفون مسجلون بعد
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3">{e.employeeCode}</td>
                  <td className="px-4 py-3">{e.fullName}</td>
                  <td className="px-4 py-3">{e.position ?? '—'}</td>
                  <td className="px-4 py-3">{e.department ?? '—'}</td>
                  <td className="px-4 py-3">
                    {e.contracts[0] ? `${e.contracts[0].salary} ج.م` : '—'}
                  </td>
                  <td className="px-4 py-3">{e.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}</td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/hr/${e.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                          >
                            <Pencil size={14} /> تعديل
                          </Link>
                        )}
                        {canDelete && <DeleteButton onDelete={deleteEmployee.bind(null, e.id)} />}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={params} />
      </div>
    </div>
  );
}