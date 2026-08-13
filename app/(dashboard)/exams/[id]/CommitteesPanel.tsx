'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { addCommittee, updateCommittee, deleteCommittee, type ActionState } from '../actions';

const initial: ActionState = {};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة لجنة
    </button>
  );
}

export function CommitteesPanel({ examId, committees }: { examId: string; committees: any[] }) {
  const [state, action] = useActionState(addCommittee, initial);

  return (
    <div className="card p-4">
      <h2 className="font-medium mb-3">لجان المراقبة</h2>
      <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
        <input type="hidden" name="examId" value={examId} />
        <div>
          <label className="block text-xs text-muted mb-1">القاعة</label>
          <input name="room" required className="input-field text-sm w-28" placeholder="قاعة 1" />
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-muted mb-1">المراقبون (أكواد الموظفين مفصولة بفاصلة)</label>
          <input name="members" className="input-field text-sm w-full" placeholder="EMP001, EMP002" />
        </div>
        <AddButton />
        {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
      </form>

      <ManageRows
        columns={[
          { key: 'room', label: 'القاعة' },
          { key: 'members', label: 'المراقبون' }
        ]}
        rows={committees.map((c) => ({ id: c.id, examId: c.examId, room: c.room, members: c.members ?? '' }))}
        fields={
          [
            { name: 'room', label: 'القاعة', type: 'text', required: true },
            { name: 'members', label: 'المراقبون', type: 'text' },
            { name: 'examId', label: '', type: 'hidden' }
          ] satisfies ManageField[]
        }
        updateAction={updateCommittee}
        deleteAction={deleteCommittee}
        canEdit
        canDelete
        emptyText="لا توجد لجان بعد"
      />
    </div>
  );
}
