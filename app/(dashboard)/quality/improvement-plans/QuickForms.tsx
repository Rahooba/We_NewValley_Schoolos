'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createImprovementPlan, submitPlanStatus, type ActionState } from './actions';

const initial: ActionState = {};

const STATUS_OPTIONS = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'reviewed', label: 'تحت المراجعة' },
  { value: 'completed', label: 'منفذة' }
];

function MiniSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة خطة
    </button>
  );
}

export function ImprovementPlanForm({
  users
}: {
  users: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createImprovementPlan, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end mb-4">
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">تاريخ الاستحقاق</label>
        <input type="date" name="dueDate" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المسئول عن التنفيذ</label>
        <select name="ownerId" className="input-field text-sm">
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الحالة</label>
        <select name="status" className="input-field text-sm" defaultValue="open">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <MiniSubmit />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function PlanStatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <form action={submitPlanStatus} onChange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} className="input-field text-xs py-1">
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
