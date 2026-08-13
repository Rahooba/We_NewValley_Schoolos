'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import { uploadLessonPlanFile, type ActionState } from './actions';
import { weeksRange } from '@/lib/weeks';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
      رفع الخطة
    </button>
  );
}

export function LessonPlanUploadDialog({
  subjects
}: {
  subjects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(uploadLessonPlanFile, initial);
  const weeks = weeksRange(0, 4);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary text-xs px-3 py-1.5">
        <FileUp size={14} /> رفع الخطة
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display">رفع خطة الدرس</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <form action={action} className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">المادة</label>
                <select name="subjectId" required className="input-field text-sm">
                  <option value="">— اختر المادة —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">الأسبوع</label>
                <select name="weekOf" required className="input-field text-sm">
                  {weeks.map((w) => (
                    <option key={w.mondayISO} value={w.mondayISO}>
                      {w.label} ({w.rangeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">عنوان الخطة</label>
                <input name="title" required className="input-field text-sm" placeholder="خطة أسبوع... " />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">ملف الخطة (PDF)</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,application/pdf"
                  required
                  className="input-field text-sm"
                />
              </div>
              <SubmitButton />
              {state.error && <p className="text-xs text-red-600">{state.error}</p>}
              {state.success && <p className="text-xs text-emerald-600">تم رفع الخطة</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
