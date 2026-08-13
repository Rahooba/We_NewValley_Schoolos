'use client';

import { useMemo, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { createComplaint, updateComplaintStatus, type ActionState } from './actions';

const initial: ActionState = {};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: 'جديدة', cls: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'تمت المراجعة', cls: 'bg-blue-100 text-blue-700' },
  resolved: { label: 'تم الحل', cls: 'bg-emerald-100 text-emerald-700' }
};

const TYPE_LABELS: Record<string, string> = {
  complaint: 'شكوى',
  suggestion: 'مقترح'
};

const FROM_LABELS: Record<string, string> = {
  student: 'طالب',
  employee: 'موظف',
  visitor: 'زائر'
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      تسجيل
    </button>
  );
}

function Form() {
  const [state, action] = useActionState(createComplaint, initial);
  return (
    <form action={action} className="card p-5 space-y-3 max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs text-muted mb-1">النوع *</label>
          <select name="type" required className="input-field text-sm">
            <option value="complaint">شكوى</option>
            <option value="suggestion">مقترح</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">مقدمة من *</label>
          <select name="fromType" required className="input-field text-sm">
            <option value="student">طالب</option>
            <option value="employee">موظف</option>
            <option value="visitor">زائر</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">الاسم (اختياري — يمكن التسجيل بدون اسم)</label>
          <input name="fromName" className="input-field text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">وسيلة تواصل (اختياري)</label>
        <input name="contact" className="input-field text-sm" placeholder="رقم هاتف / بريد..." />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">المحتوى *</label>
        <textarea name="content" rows={3} required className="input-field text-sm" />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

function StatusCell({ id, status, canManage }: { id: string; status: string; canManage: boolean }) {
  const [state, action] = useActionState(updateComplaintStatus.bind(null, id), initial);
  const { pending } = useFormStatus();
  const meta = STATUS_META[status] ?? STATUS_META.new;

  if (!canManage) {
    return (
      <span className={`text-xs rounded-full px-2 py-0.5 ${meta.cls}`}>{meta.label}</span>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1">
      <select name="status" defaultValue={status} className="text-xs input-field py-1 px-2">
        <option value="new">جديدة</option>
        <option value="reviewed">تمت المراجعة</option>
        <option value="resolved">تم الحل</option>
      </select>
      <button type="submit" disabled={pending} className="text-xs text-brand hover:underline">
        {pending ? '...' : 'حفظ'}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

type ComplaintRow = {
  id: string;
  type: string;
  fromType: string;
  fromName: string | null;
  contact: string | null;
  content: string;
  status: string;
  enteredByName: string;
  createdAt: string;
};

function List({ complaints, canManage }: { complaints: ComplaintRow[]; canManage: boolean }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () =>
      complaints.filter(
        (c) =>
          (typeFilter === 'all' || c.type === typeFilter) &&
          (statusFilter === 'all' || c.status === statusFilter)
      ),
    [complaints, typeFilter, statusFilter]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'complaint', label: 'شكاوى' },
          { id: 'suggestion', label: 'مقترحات' }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTypeFilter(f.id)}
            className={`px-3 py-1 text-sm rounded-sm border ${
              typeFilter === f.id ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="mx-1"></div>
        {[
          { id: 'all', label: 'كل الحالات' },
          { id: 'new', label: 'جديدة' },
          { id: 'reviewed', label: 'مراجعة' },
          { id: 'resolved', label: 'محلولة' }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1 text-sm rounded-sm border ${
              statusFilter === f.id ? 'bg-brand text-white border-brand' : 'border-border hover:border-brand'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-6 text-center text-muted text-sm">لا توجد شكاوى أو مقترحات مطابقة</div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-paper border border-border rounded-full px-2 py-0.5">
                  {TYPE_LABELS[c.type] ?? c.type}
                </span>
                <span className="text-xs bg-paper border border-border rounded-full px-2 py-0.5">
                  {FROM_LABELS[c.fromType] ?? c.fromType}
                  {c.fromName ? `: ${c.fromName}` : ' (بدون اسم)'}
                </span>
                <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
              <StatusCell id={c.id} status={c.status} canManage={canManage} />
            </div>
            <p className="mt-3 text-sm">{c.content}</p>
            <p className="mt-2 text-xs text-muted">
              {c.contact && <>للتواصل: {c.contact} — </>}أدخلها: {c.enteredByName}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// export const ComplaintPanel = { Form, List };
export { Form, List };