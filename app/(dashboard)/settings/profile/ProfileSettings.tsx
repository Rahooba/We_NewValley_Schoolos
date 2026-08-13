'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSession } from 'next-auth/react';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { updateEmail, updatePassword, type ProfileActionState } from './actions';

const initial: ProfileActionState = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

function Feedback({ state }: { state: ProfileActionState }) {
  return (
    <>
      {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600 w-full">{state.success}</p>}
    </>
  );
}

export function ProfileSettings({
  fullName,
  currentEmail,
  role
}: {
  fullName: string;
  currentEmail: string;
  role: string;
}) {
  const { update } = useSession();

  const [emailInput, setEmailInput] = useState('');
  const [emailState, emailAction] = useActionState(updateEmail, initial);
  const [passwordState, passwordAction] = useActionState(updatePassword, initial);

  useEffect(() => {
    if (emailState.success && emailInput) {
      update({ email: emailInput }).catch(() => {});
    }
  }, [emailState.success, emailInput, update]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5">
        <h1 className="text-xl font-display mb-1">الملف الشخصي</h1>
        <p className="text-sm text-muted mb-4">
          {fullName} — {role}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted mb-1">الإيميل الحالي</p>
            <p className="font-medium" dir="ltr">
              {currentEmail}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-medium mb-4">
          <Mail size={16} /> تغيير الإيميل
        </h2>
        <form action={emailAction} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs text-muted mb-1">الإيميل الجديد</label>
            <input
              name="newEmail"
              type="email"
              required
              className="input-field text-sm"
              dir="ltr"
              placeholder="new@schoolos.local"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">كلمة المرور الحالية (للتأكيد)</label>
            <input name="currentPassword" type="password" required className="input-field text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Submit label="حفظ الإيميل" />
            <Feedback state={emailState} />
          </div>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 font-medium mb-4">
          <KeyRound size={16} /> تغيير كلمة المرور
        </h2>
        <form action={passwordAction} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs text-muted mb-1">كلمة المرور الحالية</label>
            <input name="currentPassword" type="password" required className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">كلمة المرور الجديدة</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              className="input-field text-sm"
              placeholder="8 أحرف على الأقل"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">تأكيد كلمة المرور الجديدة</label>
            <input name="confirmPassword" type="password" required className="input-field text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <Submit label="حفظ كلمة المرور" />
            <Feedback state={passwordState} />
          </div>
        </form>
      </div>
    </div>
  );
}
