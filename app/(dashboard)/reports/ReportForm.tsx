'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { generateReport, type ActionState } from './actions';

const initial: ActionState = {};
const modules = [
  'شئون الطلاب', 'شئون العاملين', 'العملية التعليمية', 'الامتحانات',
  'الجودة', 'المخازن', 'الزوار', 'اللجان'
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة إلى سجل التقارير
    </button>
  );
}

export function ReportForm() {
  const [state, action] = useActionState(generateReport, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">عنوان التقرير</label>
        <input name="title" required className="input-field text-sm" placeholder="تقرير حضور شهر أغسطس" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الوحدة</label>
        <select name="module" required className="input-field text-sm">
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
