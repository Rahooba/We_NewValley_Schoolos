'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, X, AlertTriangle } from 'lucide-react';
import { StudentPicker } from '@/components/StudentPicker';
import { DeleteButton } from '@/components/DeleteButton';
import { createViolation, decideViolation, deleteViolation, type ActionState } from './actions';

const initial: ActionState = {};

const SEVERITY_META: Record<string, { label: string; cls: string; icon: string }> = {
  minor: { label: 'بسيطة', cls: 'bg-blue-100 text-blue-700', icon: '⚠' },
  medium: { label: 'متوسطة', cls: 'bg-amber-100 text-amber-700', icon: '⚠' },
  severe: { label: 'جسيمة', cls: 'bg-red-100 text-red-700', icon: '🔴' }
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending && <Loader2 size={14} className="animate-spin" />}
      حفظ
    </button>
  );
}

function CreateForm({ students, onClose }: { students: StudentOption[]; onClose: () => void }) {
  const [state, action] = useActionState(createViolation, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">تسجيل مخالفة</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">الطالب *</label>
            <StudentPicker students={students} name="studentId" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الخطورة *</label>
            <select name="severity" required className="input-field text-sm">
              <option value="minor">بسيطة</option>
              <option value="medium">متوسطة</option>
              <option value="severe">جسيمة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الوصف *</label>
            <textarea name="description" rows={3} required className="input-field text-sm" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

function DecideForm({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const [state, action] = useActionState(decideViolation.bind(null, violationId), initial);
  const { pending } = useFormStatus();
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">البت في المخالفة</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">الإجراء المتخذ *</label>
            <textarea name="actionTaken" rows={3} required className="input-field text-sm" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full text-sm">
            {pending && <Loader2 size={14} className="animate-spin" />}
            حفظ الإجراء
          </button>
        </form>
      </div>
    </div>
  );
}

type StudentOption = { id: string; fullName: string; studentCode?: string; className?: string };

type ViolationRow = {
  id: string;
  studentName: string;
  studentCode: string;
  className: string;
  severity: string;
  description: string;
  recordedBy: string;
  actionTaken: string | null;
  actionTakenBy: string | null;
  createdAt: string;
};

export function ViolationsPanel({
  canRecord,
  canAct,
  isPTOfficer,
  violations,
  students
}: {
  canRecord: boolean;
  canAct: boolean;
  isPTOfficer: boolean;
  violations: ViolationRow[];
  students: StudentOption[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">المخالفات ({violations.length})</h2>
        {canRecord && (
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary text-sm">
            <Plus size={14} /> تسجيل مخالفة
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-2 font-medium">التاريخ</th>
              <th className="px-4 py-2 font-medium">الطالب</th>
              <th className="px-4 py-2 font-medium">الخطورة</th>
              <th className="px-4 py-2 font-medium">الوصف</th>
              <th className="px-4 py-2 font-medium">الحالة</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {violations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">لا توجد مخالفات</td>
              </tr>
            )}
            {violations.map((v) => {
              const meta = SEVERITY_META[v.severity] ?? SEVERITY_META.minor;
              const isDecided = !!v.actionTaken;
              return (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-2 text-muted whitespace-nowrap">{new Date(v.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">
                    {v.studentName}
                    <span className="text-xs text-muted block">{v.studentCode} — {v.className}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.icon} {meta.label}</span>
                  </td>
                  <td className="px-4 py-2">{v.description}</td>
                  <td className="px-4 py-2">
                    {isDecided ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">تم البت</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">مفتوحة</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {!isDecided && canAct && (
                        <button
                          type="button"
                          onClick={() => setDeciding(v.id)}
                          className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                        >
                          البت
                        </button>
                      )}
                      {canRecord && <DeleteButton onDelete={deleteViolation.bind(null, v.id)} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {createOpen && <CreateForm students={students} onClose={() => setCreateOpen(false)} />}
      {deciding && <DecideForm violationId={deciding} onClose={() => setDeciding(null)} />}
    </div>
  );
}