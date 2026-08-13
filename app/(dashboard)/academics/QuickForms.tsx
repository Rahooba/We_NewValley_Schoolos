'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Plus, Upload } from 'lucide-react';
import {
  createSubject,
  createLessonPlan,
  createScheduleEntry,
  submitLessonPlan,
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

export function SubjectQuickForm() {
  const [state, action] = useActionState(createSubject, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">كود المادة</label>
        <input name="code" required className="input-field text-sm" placeholder="SUB-XXX" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">اسم المادة</label>
        <input name="name" required className="input-field text-sm" placeholder="اسم المادة" />
      </div>
      <MiniSubmit label="إضافة مادة" />
      {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
    </form>
  );
}

export function LessonPlanQuickForm({
  subjects,
  teachers
}: {
  subjects: { id: string; name: string }[];
  teachers: { id: string; fullName: string }[];
}) {
  const [state, action] = useActionState(createLessonPlan, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">المادة</label>
        <select name="subjectId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المعلم</label>
        <select name="teacherId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">عنوان الخطة</label>
        <input name="title" required className="input-field text-sm" placeholder="خطة الأسبوع" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الأسبوع</label>
        <input type="date" name="weekOf" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الموعد النهائي للتسليم</label>
        <input type="date" name="dueDate" required className="input-field text-sm" />
      </div>
      <MiniSubmit label="تحديد خطة ومهلة" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

// Shown to a teacher next to one of their own not-yet-submitted lesson plans —
// lets them attach the file/link that satisfies that specific requirement.
export function SubmitLessonPlanForm({ lessonPlanId }: { lessonPlanId: string }) {
  const [state, action] = useActionState(submitLessonPlan, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="lessonPlanId" value={lessonPlanId} />
      <input
        name="fileUrl"
        required
        placeholder="رابط ملف الخطة"
        className="input-field text-xs py-1 w-40"
      />
      <SubmitMini />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

function SubmitMini() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
      رفع
    </button>
  );
}

export function ScheduleQuickForm({ teachers }: { teachers: { id: string; fullName: string }[] }) {
  const [state, action] = useActionState(createScheduleEntry, initial);
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">المعلم</label>
        <select name="teacherId" required className="input-field text-sm">
          <option value="">— اختر —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">اليوم</label>
        <select name="day" required className="input-field text-sm">
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الحصة</label>
        <input type="number" name="period" min={1} max={10} required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المادة</label>
        <input name="subject" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفصل</label>
        <input name="className" required className="input-field text-sm" placeholder="B1" />
      </div>
      <MiniSubmit label="إضافة" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
