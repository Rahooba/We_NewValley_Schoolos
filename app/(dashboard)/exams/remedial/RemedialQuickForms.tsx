'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import {
  createRemedialFlag,
  createFormativeAssessment,
  type ActionState
} from './actions';

const initial: ActionState = {};

function MiniSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

type StudentOption = { id: string; label: string };

export function RemedialFlagForm({
  students,
  exams,
  defaultStudentId
}: {
  students: StudentOption[];
  exams: { id: string; name: string }[];
  defaultStudentId?: string;
}) {
  const [state, action] = useActionState(createRemedialFlag, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">الطالب</label>
        <select name="studentId" required defaultValue={defaultStudentId ?? ''} className="input-field text-sm">
          <option value="">اختر الطالب</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المادة</label>
        <input name="subject" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الامتحان</label>
        <select name="examId" className="input-field text-sm">
          <option value="">—</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">السبب</label>
        <input name="reason" className="input-field text-sm" placeholder="أقل من حد المعالجة" />
      </div>
      <MiniSubmit label="إضافة خطة علاجية" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function FormativeAssessmentForm({ students }: { students: StudentOption[] }) {
  const [state, action] = useActionState(createFormativeAssessment, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">الطالب</label>
        <select name="studentId" required defaultValue="" className="input-field text-sm">
          <option value="">اختر الطالب</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المادة</label>
        <input name="subject" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الدرجة</label>
        <input type="number" step="0.01" min="0" name="score" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الكلية</label>
        <input type="number" step="0.01" min="1" name="maxScore" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="assessmentDate" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs text-muted mb-1">ملاحظات</label>
        <input name="notes" className="input-field text-sm" />
      </div>
      <MiniSubmit label="تسجيل تقييم تكويني" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
