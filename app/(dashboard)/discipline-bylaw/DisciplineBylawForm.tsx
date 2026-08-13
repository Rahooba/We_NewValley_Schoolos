'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { saveBylawSection, type ActionState } from '../governance/actions';

const initial: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      حفظ
    </button>
  );
}

interface DisciplineFormProps {
  section: string;
  defaultTitle: string;
  defaultContent: string;
  canManage: boolean;
}

export function DisciplineBylawForm({ section, defaultTitle, defaultContent, canManage }: DisciplineFormProps) {
  const [state, action] = useActionState(saveBylawSection.bind(null, section), initial);
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" defaultValue={defaultTitle} required className="input-field text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المحتوى (Markdown)</label>
        <textarea name="content" defaultValue={defaultContent} rows={10} required className="input-field text-sm font-mono" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">تم الحفظ</p>}
      {canManage ? <SubmitButton /> : <p className="text-xs text-muted">إدارة فقط — المدير التنفيذي</p>}
    </form>
  );
}