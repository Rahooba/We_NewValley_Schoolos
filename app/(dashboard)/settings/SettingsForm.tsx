'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { updateSettings, type ActionState } from './actions';

const initial: ActionState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending ? <Loader2 size={16} className="animate-spin inline-block ml-1" /> : null}
      حفظ الإعدادات
    </button>
  );
}

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action] = useActionState(updateSettings, initial);
  return (
    <form action={action} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs text-muted mb-1">حد المعالجة (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          name="remedial_threshold_percent"
          defaultValue={values['remedial_threshold_percent'] ?? '65'}
          className="input-field"
        />
        <p className="text-xs text-muted mt-1">نسبة النجاح/المعالجة المستخدمة في صفحات المتابعة العلاجية</p>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">حد الإثراء (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          name="enrichment_threshold_percent"
          defaultValue={values['enrichment_threshold_percent'] ?? '90'}
          className="input-field"
        />
        <p className="text-xs text-muted mt-1">الطلاب فوق هذه النسبة يظهرون في قائمة الخطط الإثرائية</p>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">حد الإنذار (عدد أيام الغياب)</label>
        <input
          type="number"
          min="1"
          name="absence_warning_threshold_days"
          defaultValue={values['absence_warning_threshold_days'] ?? '3'}
          className="input-field"
        />
        <p className="text-xs text-muted mt-1">عند بلوغ الطالب هذا العدد من أيام الغياب يستحق إنذارًا</p>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الفترة المحسوبة للإنذار (أيام)</label>
        <input
          type="number"
          min="1"
          name="absence_warning_break_days"
          defaultValue={values['absence_warning_break_days'] ?? '5'}
          className="input-field"
        />
        <p className="text-xs text-muted mt-1">النافذة الزمنية التي تُحسب خلالها أيام الغياب</p>
      </div>
      <SaveButton />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">تم الحفظ</p>}
    </form>
  );
}
