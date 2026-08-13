'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { createStudent, updateStudent, type CreateStudentState } from '../actions';

type ClassOption = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

export type EditStudentValues = {
  id: string;
  studentCode: string;
  fullName: string;
  gender: string | null;
  birthDate: string | null;
  classId: string | null;
  sectionId: string | null;
  track: string | null;
  parentName: string | null;
  parentPhone: string | null;
};

const initialState: CreateStudentState = {};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      {editing ? 'حفظ التعديلات' : 'حفظ الطالب'}
    </button>
  );
}

export function StudentForm({
  classes,
  student
}: {
  classes: ClassOption[];
  student?: EditStudentValues;
}) {
  const editing = Boolean(student);
  const [state, formAction] = useActionState(student ? updateStudent : createStudent, initialState);

  return (
    <form action={formAction} className="card p-6 space-y-6 max-w-2xl">
      {student && <input type="hidden" name="id" value={student.id} />}
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">كود الطالب *</label>
          <input
            name="studentCode"
            required
            className="input-field"
            placeholder="STU-0001"
            defaultValue={student?.studentCode ?? ''}
          />
          {state.fieldErrors?.studentCode && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.studentCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الاسم بالكامل *</label>
          <input
            name="fullName"
            required
            className="input-field"
            placeholder="اسم الطالب"
            defaultValue={student?.fullName ?? ''}
          />
          {state.fieldErrors?.fullName && (
            <p className="text-xs text-red-600 mt-1">{state.fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">النوع</label>
          <select name="gender" className="input-field" defaultValue={student?.gender ?? ''}>
            <option value="">— اختر —</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تاريخ الميلاد</label>
          <input
            type="date"
            name="birthDate"
            className="input-field"
            defaultValue={student?.birthDate?.slice(0, 10) ?? ''}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الصف الدراسي</label>
          <select name="classId" className="input-field" defaultValue={student?.classId ?? ''}>
            <option value="">— بدون —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الفصل</label>
          <select name="sectionId" className="input-field" defaultValue={student?.sectionId ?? ''}>
            <option value="">— بدون —</option>
            {classes
              .flatMap((c) => c.sections)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">التخصص</label>
          <select name="track" className="input-field" defaultValue={student?.track ?? ''}>
            <option value="">— بدون (سنة أولى: عام) —</option>
            <option value="برمجة">برمجة</option>
            <option value="شبكات">شبكات</option>
            <option value="اتصالات">اتصالات</option>
          </select>
          <p className="text-xs text-muted mt-1">يُحدد فقط لطلاب السنة الثانية والثالثة</p>
        </div>
      </div>

      {classes.length === 0 && (
        <p className="text-xs text-muted">
          لا توجد صفوف دراسية مضافة بعد، يمكنك حفظ الطالب بدون صف واختيار الصف لاحقًا بعد
          إضافة وحدة "العملية التعليمية".
        </p>
      )}

      <div className="border-t border-border pt-4">
        <h2 className="text-sm font-medium mb-3">بيانات ولي الأمر (اختياري)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم ولي الأمر</label>
            <input name="parentName" className="input-field" defaultValue={student?.parentName ?? ''} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input name="parentPhone" className="input-field" defaultValue={student?.parentPhone ?? ''} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton editing={editing} />
      </div>
    </form>
  );
}
