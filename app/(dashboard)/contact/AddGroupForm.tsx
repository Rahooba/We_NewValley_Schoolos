'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { addGroup, type ActionState } from '../governance/actions';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      إضافة
    </button>
  );
}

export function AddGroupForm() {
  const [state, action] = useActionState(addGroup, initial);
  return (
    <form action={action} className="card p-4 space-y-3 max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="اسم المجموعة (مثال: مجموعة المعلمين)" className="input-field text-sm" />
        <select name="platform" required className="input-field text-sm">
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="facebook">Facebook</option>
          <option value="other">أخرى</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الرابط</label>
        <input name="link" placeholder="https://..." className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">وصف (اختياري)</label>
        <input name="description" placeholder="مثال: مجموعة المعلنين الرسميين..." className="input-field text-sm" />
      </div>
      <SubmitButton />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">تمت الإضافة</p>}
    </form>
  );
}