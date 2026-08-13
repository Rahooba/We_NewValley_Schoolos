'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { addMaintenance, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة طلب
    </button>
  );
}

export function MaintenanceForm({ assets }: { assets: { id: string; name: string }[] }) {
  const [state, action] = useActionState(addMaintenance, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">الصنف</label>
        <select name="assetId" required className="input-field text-sm">
          <option value="">اختر الصنف</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-40">
        <label className="block text-xs text-muted mb-1">وصف العطل</label>
        <input name="issue" required className="input-field text-sm w-full" placeholder="مثال: شاشة لا تعمل" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">تاريخ الصيانة</label>
        <input type="date" name="scheduledAt" className="input-field text-sm" />
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
    </form>
  );
}
