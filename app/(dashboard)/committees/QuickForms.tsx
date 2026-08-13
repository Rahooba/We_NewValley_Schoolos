'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { createCommittee, addMember, scheduleMeeting, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

export function CommitteeForm() {
  const [state, action] = useActionState(createCommittee, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اسم اللجنة</label>
        <input name="name" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الغرض</label>
        <input name="purpose" className="input-field text-sm" />
      </div>
      <MiniSubmit label="إضافة لجنة" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function MemberForm({ committees }: { committees: { id: string; name: string }[] }) {
  const [state, action] = useActionState(addMember, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اللجنة</label>
        <select name="committeeId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">اسم العضو</label>
        <input name="fullName" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الدور باللجنة</label>
        <input name="role" className="input-field text-sm" placeholder="رئيس / عضو" />
      </div>
      <MiniSubmit label="إضافة عضو" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function MeetingForm({ committees }: { committees: { id: string; name: string }[] }) {
  const [state, action] = useActionState(scheduleMeeting, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اللجنة</label>
        <select name="committeeId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="date" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">جدول الأعمال</label>
        <input name="agenda" className="input-field text-sm" />
      </div>
      <MiniSubmit label="جدولة اجتماع" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
