'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { createNotice, type ActionState } from '../actions';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      نشر
    </button>
  );
}

export function AddNoticeForm() {
  const [state, action] = useActionState(createNotice, initial);
  return (
    <form action={action} className="card p-4 space-y-3 max-w-3xl">
      <textarea
        name="content"
        rows={3}
        required
        placeholder="نص الإعلان..."
        className="input-field text-sm"
      />
      <SubmitButton />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">تم النشر</p>}
    </form>
  );
}