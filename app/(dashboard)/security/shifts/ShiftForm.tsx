'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createShift, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة وردية
    </button>
  );
}

export function ShiftForm({
  employees,
  date
}: {
  employees: { id: string; label: string }[];
  date: string;
}) {
  const [state, action] = useActionState(createShift, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-6">
      <input type="hidden" name="date" value={date} />
      <div>
        <label className="block text-xs text-muted mb-1">الموظف</label>
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
        <label className="block text-xs text-muted mb-1">الوردية</label>
        <select name="shift" className="input-field text-sm">
          <option value="morning">صباحية</option>
          <option value="evening">مسائية</option>
          <option value="night">ليلية</option>
        </select>
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
