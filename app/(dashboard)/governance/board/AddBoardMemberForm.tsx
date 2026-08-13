'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { addBoardMember, type ActionState } from '../actions';

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

export function AddBoardMemberForm() {
  const [state, action] = useActionState(addBoardMember, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4 items-end">
      <input name="name" required placeholder="الاسم" className="input-field text-sm" />
      <input name="schoolRole" required placeholder="الصفة (مثال: رئيس المجلس)" className="input-field text-sm" />
      <input name="order" type="number" placeholder="الترتيب" className="input-field text-sm" />
      <SubmitButton />
      {state.error && <p className="text-xs text-red-600 sm:col-span-4">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600 sm:col-span-4">تمت الإضافة</p>}
    </form>
  );
}