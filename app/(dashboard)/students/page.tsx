import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PermissionGate } from '@/components/PermissionGate';
import { DeleteButton } from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';
import { deleteStudent } from './actions';

const PAGE_SIZE = 25;

export default async function StudentsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canEdit = permissions.includes('students.edit');
  const canDelete = permissions.includes('students.delete');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      include: { class: true, section: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.student.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const showActions = canEdit || canDelete;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">شئون الطلاب</h1>
        <PermissionGate permission="students.create">
          <Link href="/students/new" className="btn-primary">
            <Plus size={16} />
            إضافة طالب
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
                <th className="px-4 py-3 font-medium">الصف</th>
                <th className="px-4 py-3 font-medium">الفصل</th>
                <th className="px-4 py-3 font-medium">التخصص</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                {showActions && <th className="px-4 py-3 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="px-4 py-10 text-center text-muted">
                    لا يوجد طلاب مسجلين بعد
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">{s.studentCode}</td>
                  <td className="px-4 py-3">{s.fullName}</td>
                  <td className="px-4 py-3">{s.class?.name ?? '—'}</td>
                  <td className="px-4 py-3">{s.section?.name ?? '—'}</td>
                  <td className="px-4 py-3">{s.track ?? '—'}</td>
                  <td className="px-4 py-3">{s.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}</td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/students/${s.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                          >
                            <Pencil size={14} /> تعديل
                          </Link>
                        )}
                        {canDelete && <DeleteButton onDelete={deleteStudent.bind(null, s.id)} />}
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