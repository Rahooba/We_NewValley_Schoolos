import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/Pagination';
import { DeleteButton } from '@/components/DeleteButton';
import { LabSessionForm } from './LabSessionForm';
import { InstructionForm } from './InstructionForm';
import { deleteLabSession, deleteLabInstruction } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function LabsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('labs.manage');
  if (!permissions.includes('labs.view')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const tab = params.tab === 'instructions' ? 'instructions' : 'log';
  const page = Math.max(1, Number(params.page) || 1);

  const [sessions, sessionTotal, instructions, instructionTotal, labNames, instructionLabNames] = await Promise.all([
    prisma.labSession.findMany({
      include: { employee: true },
      orderBy: { timestamp: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.labSession.count(),
    prisma.labInstruction.findMany({
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.labInstruction.count(),
    prisma.labSession.findMany({
      select: { labName: true },
      distinct: ['labName'],
      orderBy: { labName: 'asc' }
    }),
    prisma.labInstruction.findMany({
      select: { labName: true },
      distinct: ['labName'],
      orderBy: { labName: 'asc' }
    })
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(sessionTotal, instructionTotal) / PAGE_SIZE)
  );
  const names = Array.from(
    new Set([...labNames.map((l) => l.labName), ...instructionLabNames.map((i) => i.labName)])
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">سجل المعامل</h1>
        <p className="text-sm text-muted">محاضر فتح وغلق المعامل وتعليمات السلامة</p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/labs"
          className={`text-sm rounded-sm px-3 py-1.5 border ${
            tab === 'log' ? 'bg-brand text-white border-brand' : 'border-border text-muted hover:border-brand'
          }`}
        >
          محاضر الفتح والغلق
        </Link>
        <Link
          href="/labs?tab=instructions"
          className={`text-sm rounded-sm px-3 py-1.5 border ${
            tab === 'instructions'
              ? 'bg-brand text-white border-brand'
              : 'border-border text-muted hover:border-brand'
          }`}
        >
          تعليمات السلامة
        </Link>
      </div>

      {tab === 'log' && (
        <>
          {canManage && <LabSessionForm labNames={names} />}
          <section>
            <h2 className="text-lg font-medium mb-3">محاضر فتح وغلق المعامل</h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-paper text-muted text-right">
                  <tr>
                    <th className="px-4 py-2 font-medium">الوقت</th>
                    <th className="px-4 py-2 font-medium">المعمل</th>
                    <th className="px-4 py-2 font-medium">الإجراء</th>
                    <th className="px-4 py-2 font-medium">السلامة</th>
                    <th className="px-4 py-2 font-medium">بواسطة</th>
                    <th className="px-4 py-2 font-medium">ملاحظات</th>
                    {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="px-4 py-10 text-center text-muted">
                        لا توجد محاضر بعد
                      </td>
                    </tr>
                  )}
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-2">{new Date(s.timestamp).toLocaleString('ar-EG')}</td>
                      <td className="px-4 py-2 font-medium">{s.labName}</td>
                      <td className="px-4 py-2">
                        {s.action === 'open' ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">فتح</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">غلق</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {s.safetyChecklistPassed ? '✓ نعم' : <span className="text-red-600">✗ لم يمر</span>}
                      </td>
                      <td className="px-4 py-2">{s.employee.fullName}</td>
                      <td className="px-4 py-2">{s.notes ?? '—'}</td>
                      {canManage && (
                        <td className="px-4 py-2">
                          <DeleteButton onDelete={deleteLabSession.bind(null, s.id)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </section>

          <Pagination page={page} totalPages={totalPages} searchParams={params} />
        </>
      )}

      {tab === 'instructions' && (
        <>
          {canManage && <InstructionForm labNames={names} />}
          <section>
            <h2 className="text-lg font-medium mb-3">تعليمات وسلامة المعامل</h2>
            <div className="space-y-3">
              {instructions.length === 0 && (
                <div className="card p-10 text-center text-muted text-sm">لا توجد تعليمات بعد</div>
              )}
              {instructions.map((i) => (
                <div key={i.id} className="card p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {i.title} <span className="text-xs text-muted">— {i.labName}</span>
                    </p>
                    <p className="text-sm text-ink mt-1">{i.content}</p>
                    <p className="text-xs text-muted mt-2">
                      {new Date(i.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  {canManage && <DeleteButton onDelete={deleteLabInstruction.bind(null, i.id)} />}
                </div>
              ))}
            </div>
          </section>

          <Pagination page={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}
