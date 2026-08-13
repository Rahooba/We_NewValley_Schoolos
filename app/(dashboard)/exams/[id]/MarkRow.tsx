'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import { saveMark, deleteMark, type ActionState } from '../actions';

const initial: ActionState = {};

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      حفظ
    </button>
  );
}

export function MarkRow({
  examId,
  studentId,
  studentName,
  subject,
  score,
  maxScore,
  markId
}: {
  examId: string;
  studentId: string;
  studentName: string;
  subject: string;
  score?: number;
  maxScore?: number;
  markId?: string;
}) {
  const [state, action] = useActionState(saveMark, initial);
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2">{studentName}</td>
      <td className="px-4 py-2">
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="examId" value={examId} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="subject" value={subject} />
          <input
            type="number"
            step="0.5"
            name="score"
            defaultValue={score ?? ''}
            placeholder="الدرجة"
            className="input-field text-sm w-24"
          />
          <span className="text-muted">/</span>
          <input
            type="number"
            step="0.5"
            name="maxScore"
            defaultValue={maxScore ?? 100}
            placeholder="الكلية"
            className="input-field text-sm w-20"
          />
          <SaveBtn />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </form>
      </td>
      {markId && (
        <td className="px-4 py-2 w-12">
          <DeleteButton onDelete={() => deleteMark(markId)} />
        </td>
      )}
    </tr>
  );
}
