'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createBroadcast, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة إذاعة
    </button>
  );
}

export function BroadcastForm({
  classes,
  employees
}: {
  classes: string[];
  employees: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createBroadcast, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="broadcastDate" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">الموضوع</label>
        <input name="theme" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفصل المكلف</label>
        <select name="className" className="input-field text-sm">
          <option value="">—</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المشرف</label>
        <select name="employeeId" className="input-field text-sm">
          <option value="">—</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
