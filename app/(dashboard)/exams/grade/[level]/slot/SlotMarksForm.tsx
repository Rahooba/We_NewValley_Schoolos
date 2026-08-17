'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { FIXED_SUBJECTS } from '@/lib/examSlots';
import { classifyScore, GRADE_TIERS, type GradeTier } from '@/lib/exams/grade-tier';
import { saveSlotMarks, type ActionState } from '../../../actions';

const initial: ActionState = {};

const TIER_BADGE: Record<GradeTier, string> = {
  EE: 'bg-emerald-100 text-emerald-700',
  ME: 'bg-sky-100 text-sky-700',
  NI: 'bg-amber-100 text-amber-700',
  UN: 'bg-red-100 text-red-700'
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 size={16} className="animate-spin" />}
      حفظ جميع الدرجات
    </button>
  );
}

function TierBadge({ score, maxScore }: { score: number | null; maxScore: number }) {
  if (score === null || score === undefined || maxScore <= 0) return null;
  try {
    const tier = classifyScore(score, maxScore);
    const label = GRADE_TIERS.find((t) => t.tier === tier)?.label ?? tier;
    return (
      <span className={`text-[10px] px-1 py-0.5 rounded ${TIER_BADGE[tier]}`}>
        {label}
      </span>
    );
  } catch {
    return null;
  }
}

export function SlotMarksForm({
  level,
  slot,
  classes,
  students,
  existingScores,
  existingMaxScores
}: {
  level: number;
  slot: string;
  classes: string[];
  students: { id: string; fullName: string; studentCode: string; className: string; sectionName: string }[];
  existingScores: Map<string, Map<string, number>>;
  existingMaxScores: Map<string, number>;
}) {
  const [state, action] = useActionState(saveSlotMarks, initial);
  const [className, setClassName] = useState(classes[0] ?? '');

  // Max scores per subject — default 100, editable
  const [maxScores, setMaxScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const subj of FIXED_SUBJECTS) {
      init[subj] = existingMaxScores.get(subj) ?? 100;
    }
    return init;
  });

  const classStudents = useMemo(
    () => students.filter((s) => s.className === className),
    [students, className]
  );

  const [localScores, setLocalScores] = useState<Record<string, Record<string, number>>>({});

  const handleChange = (studentId: string, subject: string, value: string) => {
    const num = value === '' ? NaN : Number(value);
    setLocalScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: num }
    }));
  };

  const handleMaxScoreChange = (subject: string, value: string) => {
    const num = Math.max(1, Number(value) || 100);
    setMaxScores((prev) => ({ ...prev, [subject]: num }));
  };

  const getScore = (studentId: string, subject: string): number | null => {
    const local = localScores[studentId]?.[subject];
    if (local !== undefined && !Number.isNaN(local)) return local;
    const saved = existingScores.get(studentId)?.get(subject);
    if (saved !== undefined) return saved;
    return null;
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gradeLevel" value={level} />
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="className" value={className} />
      {/* Send max scores as JSON */}
      <input type="hidden" name="maxScores" value={JSON.stringify(maxScores)} />

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

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">تم حفظ جميع الدرجات</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs min-w-[900px] border-collapse">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-2 py-2 font-medium sticky right-0 bg-paper">الكود</th>
                <th className="px-2 py-2 font-medium sticky right-8 bg-paper">الطالب</th>
                {FIXED_SUBJECTS.map((subj) => (
                  <th key={subj} className="px-1 py-2 font-medium text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <span>{subj}</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px]">من</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={maxScores[subj]}
                          onChange={(e) => handleMaxScoreChange(subj, e.target.value)}
                          className="input-field text-[10px] w-12 text-center py-0.5 px-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={FIXED_SUBJECTS.length + 2}
                    className="px-4 py-6 text-center text-muted"
                  >
                    لا يوجد طلاب في هذا الفصل
                  </td>
                </tr>
              )}
              {classStudents.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-2 py-1.5 text-muted sticky right-0 bg-inherit">{s.studentCode}</td>
                  <td className="px-2 py-1.5 font-medium sticky right-8 bg-inherit whitespace-nowrap">
                    {s.fullName}
                  </td>
                  {FIXED_SUBJECTS.map((subj) => {
                    const score = getScore(s.id, subj);
                    const ms = maxScores[subj];
                    return (
                      <td key={subj} className="px-1 py-1.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max={ms}
                            step="0.01"
                            name={`score_${s.id}_${subj}`}
                            value={score !== null ? score : ''}
                            onChange={(e) => handleChange(s.id, subj, e.target.value)}
                            placeholder="—"
                            className="input-field text-xs w-14 text-center py-1 px-1"
                          />
                          <TierBadge score={score} maxScore={ms} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SaveButton />
        <p className="text-xs text-muted">حدّث الدرجة القصوى لكل مادة في صف الأعمدة — تُحفظ الدرجات لكل طالب دفعة واحدة</p>
      </div>
    </form>
  );
}
