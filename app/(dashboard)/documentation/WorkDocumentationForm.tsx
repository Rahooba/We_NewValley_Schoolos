'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createWorkDocumentation, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة إثبات
    </button>
  );
}

export function WorkDocumentationForm() {
  const [state, action] = useActionState(createWorkDocumentation, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">القسم</label>
        <input name="department" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="documentedAt" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">الوصف</label>
        <input name="description" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs text-muted mb-1">رابط المرفق (اختياري)</label>
        <input name="fileUrl" className="input-field text-sm" dir="ltr" />
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
