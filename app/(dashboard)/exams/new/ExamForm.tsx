'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createExam, type ActionState } from '../actions';
import { GRADE_LABELS } from '@/lib/examSlots';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      حفظ الامتحان
    </button>
  );
}

export function ExamForm() {
  const [state, action] = useActionState(createExam, initial);
  const searchParams = useSearchParams();
  const preselected = searchParams.get('gradeLevel') ?? '';

  return (
    <form action={action} className="card p-6 space-y-4 max-w-xl">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
          {state.error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">اسم الامتحان *</label>
        <input name="name" required className="input-field" placeholder="امتحان الفصل الدراسي الأول" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">الصف الدراسي</label>
        <select name="gradeLevel" defaultValue={preselected} className="input-field">
          <option value="">عام (لكل الصفوف)</option>
          {[1, 2, 3].map((l) => (
            <option key={l} value={l}>
              {GRADE_LABELS[l]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">امتحانات الفصل الدراسي تُنشأ من صفحة الصف لتظهر ضمنه</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">من *</label>
          <input type="date" name="startDate" required className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">إلى *</label>
          <input type="date" name="endDate" required className="input-field" />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}