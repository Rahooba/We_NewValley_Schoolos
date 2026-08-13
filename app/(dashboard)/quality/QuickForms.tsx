'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { createVisit, createImprovementPlan, createKPI, createRisk, type ActionState } from './actions';

const initial: ActionState = {};

function MiniSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

export function VisitForm() {
  const [state, action] = useActionState(createVisit, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">التاريخ</label>
        <input type="date" name="visitedAt" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الزائر</label>
        <input name="visitor" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الغرض</label>
        <input name="purpose" className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">ملاحظات</label>
        <input name="notes" className="input-field text-sm" />
      </div>
      <MiniSubmit label="إضافة زيارة" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function ImprovementPlanForm() {
  const [state, action] = useActionState(createImprovementPlan, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">تاريخ الاستحقاق</label>
        <input type="date" name="dueDate" className="input-field text-sm" />
      </div>
      <MiniSubmit label="إضافة خطة تحسين" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function KPIForm() {
  const [state, action] = useActionState(createKPI, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">اسم المؤشر</label>
        <input name="name" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الهدف</label>
        <input type="number" step="0.01" name="target" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفعلي</label>
        <input type="number" step="0.01" name="actual" className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفترة</label>
        <input name="period" required className="input-field text-sm" placeholder="ترم أول 2026" />
      </div>
      <MiniSubmit label="إضافة مؤشر" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}

export function RiskForm() {
  const [state, action] = useActionState(createRisk, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
      <div>
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">درجة الخطورة</label>
        <select name="severity" required className="input-field text-sm">
          <option value="منخفضة">منخفضة</option>
          <option value="متوسطة">متوسطة</option>
          <option value="عالية">عالية</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الإجراء المقترح</label>
        <input name="mitigation" className="input-field text-sm" />
      </div>
      <MiniSubmit label="إضافة مخاطرة" />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
