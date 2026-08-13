'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, X } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import {
  formInvestigationCommittee,
  decideInvestigationCommittee,
  deleteInvestigationCommittee,
  type ActionState
} from './actions';

const initial: ActionState = {};

type EmployeeOption = { id: string; fullName: string };
type StudentOption = { id: string; fullName: string; studentCode: string };
type CommitteeRow = {
  id: string;
  subject: string;
  memberNames: string[];
  committeeOpinion: string | null;
  adminOpinion: string | null;
  status: string;
  relatedStudentName: string | null;
  relatedStudentCode: string | null;
  relatedEmployeeName: string | null;
  createdAt: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm flex items-center gap-1">
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {label}
    </button>
  );
}

function CreateForm({
  employees,
  students,
  onClose
}: {
  employees: EmployeeOption[];
  students: StudentOption[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(formInvestigationCommittee, initial);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" dir="rtl">
      <div className="card w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">تشكيل لجنة استجواب</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">الموضوع / طبيعة الاستجواب *</label>
            <input name="subject" required className="input-field text-sm w-full" placeholder="موضوع التحقيق..." />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">أعضاء اللجنة (موظفين)</label>
            <div className="max-h-40 overflow-auto border border-border rounded-sm p-2 space-y-1">
              {employees.length === 0 ? (
                <p className="text-xs text-muted p-2">لا يوجد موظفون متاحون</p>
              ) : (
                employees.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="member" value={e.id} className="accent-brand" />
                    {e.fullName}
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">طالب مرتبط (اختياري)</label>
            <select name="relatedStudentId" className="input-field text-sm w-full">
              <option value="">— لا يلزم طالباً —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">موظف مرتبط (اختياري)</label>
            <select name="relatedEmployeeId" className="input-field text-sm w-full">
              <option value="">— لا يلزم موظفاً —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">رأي اللجنة (اختياري)</label>
            <textarea name="committeeOpinion" rows={2} className="input-field text-sm w-full" />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">رأي إدارة المدرسة (اختياري)</label>
            <textarea name="adminOpinion" rows={2} className="input-field text-sm w-full" />
          </div>

          {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}

          <div className="flex justify-end">
            <SubmitButton label="تشكيل اللجنة" />
          </div>
        </form>
      </div>
    </div>
  );
}

function DecideForm({
  committeeId,
  onDone
}: {
  committeeId: string;
  onDone: () => void;
}) {
  const [state, action] = useActionState(decideInvestigationCommittee.bind(null, committeeId), initial);

  return (
    <form action={action} className="space-y-3 bg-paper border border-border rounded-sm p-4 mt-3" dir="rtl">
      <div className="flex items-center gap-3">
        <select name="status" className="input-field text-sm flex-1" defaultValue="open">
          <option value="open">مفتوحة</option>
          <option value="decided">تم البت</option>
        </select>
        <button type="submit" className="btn-primary text-xs">
          حفظ
        </button>
        <button type="button" onClick={onDone} className="text-xs text-muted hover:text-ink">
          إغلاق
        </button>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">رأي اللجنة</label>
        <textarea name="committeeOpinion" rows={2} className="input-field text-sm w-full" />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">رأي إدارة المدرسة</label>
        <textarea name="adminOpinion" rows={2} className="input-field text-sm w-full" />
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function InvestigationPanel({
  canManage,
  employees,
  employeeNames,
  studentOptions,
  committees
}: {
  canManage: boolean;
  employees: EmployeeOption[];
  employeeNames: Map<string, string>;
  studentOptions: StudentOption[];
  committees: CommitteeRow[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  return (
    <div className="space-y-8" dir="rtl">
      {createOpen && (
        <CreateForm
          employees={employees}
          students={studentOptions}
          onClose={() => setCreateOpen(false)}
        />
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">قضايا التحقيق ({committees.length})</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Plus size={14} /> تشكيل لجنة استجواب
            </button>
          )}
        </div>

        {committees.length === 0 ? (
          <div className="card p-6 text-center text-muted text-sm">لا توجد قضايا تحقيق بعد</div>
        ) : (
          <div className="space-y-3">
            {committees.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-48">
                    <p className="font-medium">{c.subject}</p>
                    <p className="text-xs text-muted mt-1">
                      تاريخ التشكيل: {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                    {c.memberNames.length > 0 && (
                      <p className="text-xs text-muted mt-1">
                        الأعضاء: {c.memberNames.join('، ')}
                      </p>
                    )}
                    {(c.relatedStudentName || c.relatedEmployeeName) && (
                      <p className="text-xs text-muted mt-1">
                        المرتبط:{' '}
                        {c.relatedStudentName
                          ? `${c.relatedStudentName} (${c.relatedStudentCode})`
                          : c.relatedEmployeeName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {c.status === 'open' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">مفتوحة</span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">تم البت</span>
                    )}
                    {canManage && (
                      <>
                        <DeleteButton onDelete={() => deleteInvestigationCommittee(c.id)} />
                        <button
                          type="button"
                          onClick={() => setDeciding(deciding === c.id ? null : c.id)}
                          className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                        >
                          البت في اللجنة
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {c.committeeOpinion && (
                  <p className="mt-3 text-sm bg-paper rounded-sm border border-border p-3">
                    <span className="font-medium">رأي اللجنة: </span>
                    {c.committeeOpinion}
                  </p>
                )}

                {c.adminOpinion && (
                  <p className="mt-2 text-sm bg-paper rounded-sm border border-border p-3">
                    <span className="font-medium">رأي الإدارة: </span>
                    {c.adminOpinion}
                  </p>
                )}

                {deciding === c.id && canManage && (
                  <DecideForm committeeId={c.id} onDone={() => setDeciding(null)} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
