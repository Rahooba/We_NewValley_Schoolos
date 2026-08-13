'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createLabSession, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      تسجيل المحضر
    </button>
  );
}

export function LabSessionForm({ labNames }: { labNames: string[] }) {
  const [state, action] = useActionState(createLabSession, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end mb-6">
      <div>
        <label className="block text-xs text-muted mb-1">المعمل</label>
        <input name="labName" list="lab-names" required className="input-field text-sm" />
        <datalist id="lab-names">
          {labNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الإجراء</label>
        <select name="action" className="input-field text-sm">
          <option value="open">فتح المعمل</option>
          <option value="close">غلق المعمل</option>
        </select>
      </div>
      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="safetyChecklistPassed" defaultChecked className="accent-brand" />
          اجتاز فحص السلامة
        </label>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">ملاحظات</label>
        <input name="notes" className="input-field text-sm" />
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
