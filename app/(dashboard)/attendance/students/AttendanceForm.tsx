'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { markStudentAttendance, type ActionState } from './actions';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'PRESENT', label: 'حاضر' },
  { value: 'ABSENT', label: 'غائب' },
  { value: 'LATE', label: 'متأخر' },
  { value: 'EXCUSED', label: 'إذن' }
];

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      حفظ الحضور
    </button>
  );
}

export function StudentAttendanceForm({
  students
}: {
  students: { id: string; fullName: string; studentCode: string; className: string; status: string | null }[];
}) {
  const [state, action] = useActionState(markStudentAttendance, initial);

  return (
    <form action={action}>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الكود</th>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الفصل</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted">{s.studentCode}</td>
                <td className="px-4 py-3">{s.fullName}</td>
                <td className="px-4 py-3 text-muted">{s.className}</td>
                <td className="px-4 py-3">
                  <input type="hidden" name="studentId" value={s.id} />
                  <div className="flex gap-3 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`status_${s.id}`}
                          value={opt.value}
                          defaultChecked={(s.status ?? 'PRESENT') === opt.value}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  لا يوجد طلاب مسجلين
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <SubmitButton />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-600">تم حفظ الحضور بنجاح</p>}
      </div>
    </form>
  );
}
