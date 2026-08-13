'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { createSocialMeeting, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      تسجيل الاجتماع
    </button>
  );
}

export function MeetingForm() {
  const [state, action] = useActionState(createSocialMeeting, initial);
  return (
    <form action={action} className="card p-5 space-y-3 max-w-2xl">
      <p className="font-medium text-sm">تسجيل اجتماع شهري جديد</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-muted mb-1">التاريخ *</label>
          <input type="date" name="date" required className="input-field text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">الحضور</label>
          <input name="attendees" className="input-field text-sm" placeholder="مثال: معلموا الصف الثاني، ولي أمر الطالب... (نص حر)" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الملاحظات *</label>
        <textarea name="notes" rows={2} required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">النتيجة / الخلاصة *</label>
        <textarea name="outcome" rows={2} required className="input-field text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}