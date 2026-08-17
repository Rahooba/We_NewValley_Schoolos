'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { saveSlotMarks, type ActionState } from '../../../actions';

const initial: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      حفظ درجات الفصل
    </button>
  );
}

export function SlotMarksForm({
  level,
  slot,
  subject,
  classes,
  students,
  scoresByClass,
  initialMaxScore
}: {
  level: number;
  slot: string;
  subject: string;
  classes: string[];
  students: { id: string; fullName: string; studentCode: string; className: string; sectionName: string }[];
  scoresByClass: Map<string, Map<string, number>>;
  initialMaxScore?: number;
}) {
  const [state, action] = useActionState(saveSlotMarks, initial);
  const [className, setClassName] = useState(classes[0] ?? '');
  const [maxScore, setMaxScore] = useState(initialMaxScore ?? 100);

  const classStudents = useMemo(
    () => students.filter((s) => s.className === className),
    [students, className]
  );
  const existingScores = scoresByClass.get(className) ?? new Map<string, number>();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gradeLevel" value={level} />
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="className" value={className} />
      <input type="hidden" name="maxScore" value={maxScore} />

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted">الفصل:</span>
        {classes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setClassName(c)}
            className={`text-sm px-3 py-1 rounded-sm border ${
              c === className ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="card p-4 flex items-center gap-3">
        <label className="text-sm text-muted">الدرجة القصوى:</label>
        <input
          type="number"
          min="1"
          max="1000"
          value={maxScore}
          onChange={(e) => setMaxScore(Number(e.target.value) || 100)}
          className="input-field text-sm w-24"
        />
        <span className="text-xs text-muted">(تختلف من مادة للتانية)</span>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">تم حفظ الدرجات</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-2 font-medium">الكود</th>
              <th className="px-4 py-2 font-medium">الطالب</th>
              <th className="px-4 py-2 font-medium">الفرع</th>
              <th className="px-4 py-2 font-medium">الدرجة (من {maxScore})</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  لا يوجد طلاب في هذا الفصل
                </td>
              </tr>
            )}
            {classStudents.map((s) => {
              const value = existingScores.get(s.id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted">{s.studentCode}</td>
                  <td className="px-4 py-2 font-medium">{s.fullName}</td>
                  <td className="px-4 py-2 text-muted">{s.sectionName}</td>
                  <td className="px-4 py-2 w-28">
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      step="0.01"
                      name={`score_${s.id}`}
                      defaultValue={value ?? ''}
                      placeholder="—"
                      className="input-field text-sm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SaveButton />
        <p className="text-xs text-muted">تُحفظ الدرجات لكل طالب، ويمكن تعديلها في أي وقت</p>
      </div>
    </form>
  );
}