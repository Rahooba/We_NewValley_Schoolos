'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createSupervision, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة مشرف
    </button>
  );
}

export function SupervisionForm({
  employees,
  date
}: {
  employees: { id: string; label: string }[];
  date: string;
}) {
  const [state, action] = useActionState(createSupervision, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end mb-6">
      <input type="hidden" name="date" value={date} />
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">المشرف</label>
        <select name="employeeId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">نطاق الإشراف</label>
        <input name="area" className="input-field text-sm" placeholder="مثال: الدور الأرضي" />
      </div>
      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isGeneralSupervisor" className="accent-brand" />
          مشرف عام (واحد فقط يوميًا)
        </label>
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
