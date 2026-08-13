'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createWarning, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إصدار إنذار
    </button>
  );
}

export function WarningForm({ students }: { students: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createWarning, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">الطالب</label>
        <select name="studentId" required defaultValue="" className="input-field text-sm">
          <option value="">اختر الطالب</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">السبب</label>
        <input name="reason" required className="input-field text-sm" placeholder="تكرار الغياب" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="warningDate" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">نص الإنذار</label>
        <input name="message" className="input-field text-sm" />
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
