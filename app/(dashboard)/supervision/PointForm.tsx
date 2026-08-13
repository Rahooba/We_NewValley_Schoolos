'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { addPoint, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      تسجيل النقطة
    </button>
  );
}

export function PointForm({
  schedules,
  dateLabel
}: {
  schedules: { id: string; label: string }[];
  dateLabel: string;
}) {
  const [state, action] = useActionState(addPoint, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
      <input type="hidden" name="dateLabel" value={dateLabel} />
      <div>
        <label className="block text-xs text-muted mb-1">المشرف المسجل</label>
        <select name="scheduleId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">وصف النقطة</label>
        <input name="description" required className="input-field text-sm" />
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
