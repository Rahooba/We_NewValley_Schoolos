'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createActivity, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة نشاط
    </button>
  );
}

export function ActivityForm() {
  const [state, action] = useActionState(createActivity, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">النوع</label>
        <select name="type" className="input-field text-sm">
          <option value="">—</option>
          <option>رياضي</option>
          <option>ثقافي</option>
          <option>اجتماعي</option>
          <option>علمي</option>
          <option>ترفيهي</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="activityDate" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المكان</label>
        <input name="location" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المنظم</label>
        <input name="organizer" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs text-muted mb-1">الوصف</label>
        <input name="description" className="input-field text-sm" />
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
