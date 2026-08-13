'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { createGateLog, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
      تسجيل التواجد
    </button>
  );
}

export function GateLogForm({
  students,
  employees
}: {
  students: { id: string; label: string }[];
  employees: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createGateLog, initial);
  const [personType, setPersonType] = useState<'student' | 'employee' | 'visitor'>('student');

  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end mb-6">
      <div>
        <label className="block text-xs text-muted mb-1">نوع الشخص</label>
        <select
          name="personType"
          value={personType}
          onChange={(e) => setPersonType(e.target.value as typeof personType)}
          className="input-field text-sm"
        >
          <option value="student">طالب</option>
          <option value="employee">موظف / معلم</option>
          <option value="visitor">زائر</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">
          {personType === 'student' ? 'الطالب' : personType === 'employee' ? 'الموظف / المعلم' : 'اسم الزائر'}
        </label>
        {personType === 'visitor' ? (
          <input name="personName" required className="input-field text-sm" />
        ) : (
          <select name="personId" required className="input-field text-sm">
            <option value="">— اختر بالاسم أو الكود —</option>
            {(personType === 'student' ? students : employees).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">الاتجاه</label>
        <select name="direction" className="input-field text-sm">
          <option value="in">دخول</option>
          <option value="out">خروج</option>
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
