'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { submitDailySummary, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
      {isEdit ? 'تعديل ملخص اليوم' : 'إرسال ملخص اليوم'}
    </button>
  );
}

export function DailySummaryForm({
  date,
  existing
}: {
  date: string;
  existing?: { summary: string; incidentsReported: boolean; incidentNotes?: string | null } | null;
}) {
  const [state, action] = useActionState(submitDailySummary, initial);
  const [hasIncidents, setHasIncidents] = useState(existing?.incidentsReported ?? false);

  return (
    <form action={action} className="card p-5 space-y-3 mb-6">
      <input type="hidden" name="date" value={date} />
      <div>
        <label className="block text-xs text-muted mb-1">ملخص نهاية اليوم</label>
        <textarea
          name="summary"
          required
          defaultValue={existing?.summary ?? ''}
          rows={4}
          className="input-field text-sm w-full"
          placeholder="ملخص سير اليوم داخل المدرسة، الحالة العامة للأمن، الملاحظات..."
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="incidentsReported"
          checked={hasIncidents}
          onChange={(e) => setHasIncidents(e.target.checked)}
          className="accent-brand"
        />
        توجد حوادث / ملاحظات تستوجب الإفصاح
      </label>
      {hasIncidents && (
        <div>
          <label className="block text-xs text-muted mb-1">تفاصيل الحوادث</label>
          <textarea
            name="incidentNotes"
            defaultValue={existing?.incidentNotes ?? ''}
            rows={2}
            className="input-field text-sm w-full"
            placeholder="وصف الحوادث أو الملاحظات..."
          />
        </div>
      )}
      <SubmitBtn isEdit={!!existing} />
      {existing && (
        <p className="text-xs text-amber-600">
          يوجد ملخص مرسل لهذا اليوم بالفعل — التعديل يحدّثه ولن يتم إرسال ملخص ثانٍ.
        </p>
      )}
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
