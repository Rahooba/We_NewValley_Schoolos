'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { type ActionState } from '../actions';

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

interface BylawEditorProps {
  section: string;
  title: string | undefined;
  content: string | undefined;
  canManage: boolean;
  action: (section: string, prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export function BylawEditor({ section, title, content, canManage, action }: BylawEditorProps) {
  const [state, dispatch] = useActionState(action.bind(null, section), initial);
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-medium text-sm border-b border-border pb-2">
        {section === 'board_instructions' ? 'تعليمات مجلس الإدارة' : 'اللائحة الداخلية'}
      </h3>
      <form action={dispatch} className="space-y-3">
        <div>
          <label className="block text-xs text-muted mb-1">العنوان</label>
          <input
            name="title"
            defaultValue={title ?? ''}
            required
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">المحتوى (Markdown)</label>
          <textarea
            name="content"
            defaultValue={content ?? ''}
            rows={6}
            required
            className="input-field text-sm font-mono"
          />
        </div>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-600">تم الحفظ</p>}
        {canManage && <SubmitButton />}
        {!canManage && <p className="text-xs text-muted">إدارة فقط — المدير التنفيذي والأكاديمي</p>}
      </form>
    </div>
  );
}