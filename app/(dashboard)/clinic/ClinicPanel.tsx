'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus, X } from 'lucide-react';
import { StudentPicker } from '@/components/StudentPicker';
import { DeleteButton } from '@/components/DeleteButton';
import {
  createClinicCase,
  createCleanlinessLog,
  deleteClinicCase,
  deleteCleanlinessLog,
  type ActionState
} from './actions';

const initial: ActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-sm">
      {pending ? <Loader2 size={14} className="animate-spin ml-1" /> : <Plus size={14} className="ml-1" />}
      {label}
    </button>
  );
}

function CaseForm({
  students,
  onClose
}: {
  students: { id: string; fullName: string; studentCode?: string; className?: string }[];
  onClose: () => void;
}) {
  const [state, action] = useActionState(createClinicCase, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">تسجيل حالة</h3>
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
            <label className="block text-xs text-muted mb-1">الحالة المرضية *</label>
            <textarea name="condition" rows={2} required className="input-field text-sm" placeholder="مثال: صداع، ارتفاع حرارة..." />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الإجراء المتخذ</label>
            <input name="actionTaken" className="input-field text-sm" placeholder="مثال: اسعافات أولية، إبلاغ ولي الأمر" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton label="تسجيل الحالة" />
        </form>
      </div>
    </div>
  );
}

function CleanlinessForm({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState(createCleanlinessLog, initial);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">تسجيل نظافة العيادة</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">الحالة</label>
            <select name="status" required className="input-field text-sm">
              <option value="DONE">النظافة تمت</option>
              <option value="ISSUE">يوجد مشكلة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">ملاحظات</label>
            <textarea name="notes" rows={2} className="input-field text-sm" />
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <SubmitButton label="تسجيل" />
        </form>
      </div>
    </div>
  );
}

export function ClinicPanel({
  canManage,
  canManageCleanliness,
  todayCases,
  recentCases,
  cleanliness,
  students
}: {
  canManage: boolean;
  canManageCleanliness: boolean;
  todayCases: { id: string; date: string; studentName: string; studentCode: string; className: string; condition: string; actionTaken: string | null }[];
  recentCases: { id: string; date: string; studentName: string; studentCode: string; className: string; condition: string; actionTaken: string | null }[];
  cleanliness: { id: string; date: string; status: string; notes: string | null }[];
  students: { id: string; fullName: string; studentCode?: string; className?: string }[];
}) {
  const [caseOpen, setCaseOpen] = useState(false);
  const [cleanOpen, setCleanOpen] = useState(false);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">حالات اليوم ({todayCases.length})</h2>
          {canManage && (
            <button type="button" onClick={() => setCaseOpen(true)} className="btn-primary text-sm">
              <Plus size={14} /> تسجيل حالة
            </button>
          )}
        </div>
        <CaseTable cases={todayCases} canManage={canManage} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">سجل الحالات السابقة</h2>
        <CaseTable cases={recentCases} canManage={canManage} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">متابعة نظافة العيادة</h2>
          {canManageCleanliness && (
            <button type="button" onClick={() => setCleanOpen(true)} className="btn-primary text-sm">
              <Plus size={14} /> تسجيل النظافة
            </button>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                <th className="px-4 py-2 font-medium">ملاحظات</th>
                {canManageCleanliness && <th className="px-4 py-2 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {cleanliness.length === 0 && (
                <tr>
                  <td colSpan={canManageCleanliness ? 4 : 3} className="px-4 py-6 text-center text-muted">
                    لا توجد سجلات نظافة بعد
                  </td>
                </tr>
              )}
              {cleanliness.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2">{new Date(l.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2">
                    {l.status === 'DONE' ? (
                      <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">تمت</span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">يوجد مشكلة</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{l.notes || '—'}</td>
                  {canManageCleanliness && (
                    <td className="px-4 py-2">
                      <DeleteButton onDelete={deleteCleanlinessLog.bind(null, l.id)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      {caseOpen && <CaseForm students={students} onClose={() => setCaseOpen(false)} />}
      {cleanOpen && <CleanlinessForm onClose={() => setCleanOpen(false)} />}
    </div>
  );
}

function CaseTable({
  cases,
  canManage
}: {
  cases: { id: string; date: string; studentName: string; studentCode: string; className: string; condition: string; actionTaken: string | null }[];
  canManage: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
          <tr>
            <th className="px-4 py-2 font-medium">التوقيت</th>
            <th className="px-4 py-2 font-medium">الطالب</th>
            <th className="px-4 py-2 font-medium">الفصل</th>
            <th className="px-4 py-2 font-medium">الحالة</th>
            <th className="px-4 py-2 font-medium">الإجراء</th>
            {canManage && <th className="px-4 py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {cases.length === 0 && (
            <tr>
              <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-muted">
                لا توجد حالات
              </td>
            </tr>
          )}
          {cases.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-4 py-2 text-muted">{new Date(c.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
              <td className="px-4 py-2 font-medium">
                {c.studentName}
                <span className="text-xs text-muted block">{c.studentCode}</span>
              </td>
              <td className="px-4 py-2 text-muted">{c.className}</td>
              <td className="px-4 py-2">{c.condition}</td>
              <td className="px-4 py-2 text-muted">{c.actionTaken || '—'}</td>
              {canManage && (
                <td className="px-4 py-2">
                  <DeleteButton onDelete={deleteClinicCase.bind(null, c.id)} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}