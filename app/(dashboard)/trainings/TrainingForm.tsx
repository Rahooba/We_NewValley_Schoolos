'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createTraining, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      تسجيل تدريب
    </button>
  );
}

export function TrainingForm({
  employees
}: {
  employees: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createTraining, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-start mb-6">
      <div>
        <label className="block text-xs text-muted mb-1">عنوان التدريب</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المدرب</label>
        <input name="trainerName" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="date" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الوصف</label>
        <input name="description" className="input-field text-sm" />
      </div>
      <div className="flex items-end">
        <SubmitBtn />
      </div>
      <div className="sm:col-span-5">
        <label className="block text-xs text-muted mb-1">الحضور (حدد موظفًا أو أكثر)</label>
        <select name="attendeeIds" multiple required size={7} className="input-field text-sm w-full">
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">اضغط Ctrl (أو Cmd) لتحديد أكثر من موظف</p>
      </div>
      {state.error && <p className="text-xs text-red-600 sm:col-span-5">{state.error}</p>}
    </form>
  );
}
