'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { createLabInstruction, type ActionState } from './actions';

const initial: ActionState = {};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      إضافة تعليمات
    </button>
  );
}

export function InstructionForm({ labNames }: { labNames: string[] }) {
  const [state, action] = useActionState(createLabInstruction, initial);
  return (
    <form action={action} className="card p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end mb-6">
      <div>
        <label className="block text-xs text-muted mb-1">المعمل</label>
        <input name="labName" list="lab-names-instr" required className="input-field text-sm" />
        <datalist id="lab-names-instr">
          {labNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">العنوان</label>
        <input name="title" required className="input-field text-sm" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs text-muted mb-1">نص التعليمات</label>
        <input name="content" required className="input-field text-sm" />
      </div>
      <SubmitBtn />
      {state.error && <p className="text-xs text-red-600 col-span-full">{state.error}</p>}
    </form>
  );
}
