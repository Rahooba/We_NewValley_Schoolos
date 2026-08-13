'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { checkInVisitor, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
      تسجيل دخول زائر
    </button>
  );
}

export function CheckInForm() {
  const [state, action] = useActionState(checkInVisitor, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end mb-6">
      <div>
        <label className="block text-xs text-muted mb-1">اسم الزائر</label>
        <input name="fullName" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">رقم الهاتف</label>
        <input name="phone" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الغرض من الزيارة</label>
        <input name="purpose" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">لمقابلة</label>
        <input name="hostName" className="input-field text-sm" />
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
