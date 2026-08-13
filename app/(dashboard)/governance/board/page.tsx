import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PermissionGate } from '@/components/PermissionGate';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { addBoardMember, updateBoardMember, deleteBoardMember, saveBylawSection, type ActionState } from '../actions';
import { BylawEditor } from './BylawEditor';
import { AddBoardMemberForm } from './AddBoardMemberForm';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('governance.view')) redirect('/dashboard/forbidden');
  const canManage = permissions.includes('board.manage');

  const [members, bylaws] = await Promise.all([
    prisma.boardMember.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    prisma.schoolBylaw.findMany({
      where: { section: { in: ['board_instructions', 'internal_bylaw'] } }
    })
  ]);

  const instructions = bylaws.find((b) => b.section === 'board_instructions');
  const internal = bylaws.find((b) => b.section === 'internal_bylaw');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">مجلس إدارة المدرسة</h1>
        <p className="text-sm text-muted">أعضاء المجلس والنصوص الثابتة — الإدارة (تعديل) / الجميع (اطلاع)</p>
      </div>

      <PermissionGate permission="board.manage">
        <div className="card p-4">
          <p className="text-sm font-medium mb-2">إضافة عضو جديد</p>
          <AddBoardMemberForm />
        </div>
      </PermissionGate>

      <section>
        <h2 className="text-lg font-medium mb-3">أعضاء المجلس ({members.length})</h2>
        <ManageRows
          columns={[
            { key: 'order', label: 'ترتيب' },
            { key: 'name', label: 'الاسم' },
            { key: 'schoolRole', label: 'الصفة' }
          ]}
          rows={members.map((m) => ({
            id: m.id,
            order: m.order ?? '—',
            name: m.name,
            schoolRole: m.schoolRole
          }))}
          fields={
            [
              { name: 'name', label: 'الاسم', type: 'text', required: true },
              { name: 'schoolRole', label: 'الصفة', type: 'text', required: true },
              { name: 'order', label: 'الترتيب', type: 'number' }
            ] satisfies ManageField[]
          }
          updateAction={updateBoardMember}
          deleteAction={deleteBoardMember}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا يوجد أعضاء بعد"
        />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">النصوص الثابتة</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <BylawEditor
            section="board_instructions"
            title={instructions?.title}
            content={instructions?.content}
            canManage={canManage}
            action={saveBylawSection}
          />
          <BylawEditor
            section="internal_bylaw"
            title={internal?.title}
            content={internal?.content}
            canManage={canManage}
            action={saveBylawSection}
          />
        </div>
      </section>
    </div>
  );
}