'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createVisit, type ActionState } from '../../actions';

const initial: ActionState = {};

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      جدولة زيارة
    </button>
  );
}

export function ScheduleForm({ employees }: { employees: { id: string; label: string }[] }) {
  const [state, action] = useActionState(createVisit, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">تاريخ الزيارة المجدولة</label>
        <input type="date" name="plannedVisitDate" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الزائر</label>
        <input name="visitor" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المعلم / الموظف</label>
        <select name="employeeId" className="input-field text-sm">
          <option value="">—</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الغرض</label>
        <input name="purpose" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">ملاحظات</label>
        <input name="notes" className="input-field text-sm" />
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
