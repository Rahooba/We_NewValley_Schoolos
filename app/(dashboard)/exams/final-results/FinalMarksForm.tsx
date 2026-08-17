'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { saveFinalMarks, type ActionState } from './actions';

const initial: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      حفظ درجات المادة
    </button>
  );
}

export function FinalMarksForm({
  examId,
  subjectId,
  subjectName,
  maxScoreInitial,
  students,
  scoresByStudent
}: {
  examId: string;
  subjectId: string;
  subjectName: string;
  maxScoreInitial: number | null;
  students: { id: string; studentCode: string; fullName: string }[];
  scoresByStudent: Map<string, number>;
}) {
  const [state, action] = useActionState(saveFinalMarks, initial);
  const [maxScore, setMaxScore] = useState<number | null>(maxScoreInitial);

  const maxScoreError = maxScore === null || !Number.isFinite(maxScore) || maxScore <= 0;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="subjectName" value={subjectName} />

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-muted" htmlFor="final-max-score">
          درجة المادة الكلية (من كام؟) — {subjectName}
        </label>
        <input
          id="final-max-score"
          type="number"
          name="maxScore"
          min="0.5"
          step="0.5"
          required
          value={maxScore ?? ''}
          onChange={(e) => setMaxScore(e.target.value === '' ? null : Number(e.target.value))}
          placeholder="أدخل الدرجة الكلية — لا تُفترض 100"
          className="input-field text-sm w-48"
        />
        {maxScoreError && (
          <span className="text-xs text-red-600">مطلوب — تُحفظ كل الدرجات بنسبة منها، ولا تُفترض درجة كلية افتراضية</span>
        )}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">تم حفظ درجات {subjectName}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الكود</th>
                <th className="px-4 py-2 font-medium">الطالب</th>
                <th className="px-4 py-2 font-medium">الدرجة (من {maxScore && maxScore > 0 ? maxScore : '…'})</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">
                    لا يوجد طلاب مسجلون
                  </td>
                </tr>
              )}
              {students.map((s) => {
                const value = scoresByStudent.get(s.id);
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2 text-muted" dir="ltr">
                      {s.studentCode}
                    </td>
                    <td className="px-4 py-2 font-medium">{s.fullName}</td>
                    <td className="px-4 py-2 w-28">
                      <input
                        type="number"
                        min="0"
                        max={maxScore ?? undefined}
                        step="0.5"
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
        <p className="text-xs text-muted">يُحفظ لكل طالب درجة واحدة في {subjectName} من الدرجة الكلية المدخلة أعلاه</p>
      </div>
    </form>
  );
}