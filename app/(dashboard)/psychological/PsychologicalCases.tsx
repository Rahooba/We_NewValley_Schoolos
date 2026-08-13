'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useState } from 'react';
import { Brain, FolderOpen, Loader2, Plus, X } from 'lucide-react';
import { StudentPicker } from '@/components/StudentPicker';
import { DeleteButton } from '@/components/DeleteButton';
import { createPsychologicalCase, updatePsychologicalCase, deletePsychologicalCase, type ActionState } from './actions';

export type PsychCaseItem = {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string | null;
  status: string;
  sessions: number;
  notes: string | null;
  nextSessionAt: string | null;
  updatedAt: string;
};

type StudentItem = { id: string; fullName: string; studentCode?: string; className?: string };

const initial: ActionState = {};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: 'مفتوحة', cls: 'bg-red-50 text-red-700' },
  in_progress: { label: 'قيد المتابعة', cls: 'bg-amber-50 text-amber-700' },
  closed: { label: 'مغلقة', cls: 'bg-emerald-50 text-emerald-700' }
};

function CaseSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      حفظ
    </button>
  );
}

export function PsychologicalCases({
  cases,
  students
}: {
  cases: PsychCaseItem[];
  students: StudentItem[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<PsychCaseItem | null>(null);
  const [createState, createAction] = useActionState(createPsychologicalCase, initial);
  const [updateState, updateAction] = useActionState(updatePsychologicalCase, initial);

  useEffect(() => {
    if (createState.success) setCreateOpen(false);
  }, [createState.success]);
  useEffect(() => {
    if (updateState.success) setEdit(null);
  }, [updateState.success]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus size={16} /> تسجيل حالة جديدة
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-2 font-medium">الطالب</th>
              <th className="px-4 py-2 font-medium">العنوان</th>
              <th className="px-4 py-2 font-medium">الحالة</th>
              <th className="px-4 py-2 font-medium">الجلسات</th>
              <th className="px-4 py-2 font-medium">الجلسة القادمة</th>
              <th className="px-4 py-2 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const meta = STATUS_META[c.status] ?? STATUS_META.open;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{c.studentName}</td>
                  <td className="px-4 py-2">{c.title}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1">
                      <Brain size={14} className="text-muted" /> {c.sessions}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {c.nextSessionAt ? new Date(c.nextSessionAt).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEdit(c)}
                        className="text-brand hover:underline text-xs flex items-center gap-1"
                      >
                        <FolderOpen size={14} /> تفاصيل / جلسة
                      </button>
                      <DeleteButton onDelete={() => deletePsychologicalCase(c.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {cases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  لا توجد حالات نفسية مسجلة بعد
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display">تسجيل حالة نفسية</h3>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form action={createAction} className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">الطالب</label>
                <StudentPicker students={students} name="studentId" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">عنوان الحالة</label>
                <input name="title" required className="input-field text-sm" placeholder="مثال: صعوبات تعلم" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">الوصف</label>
                <textarea name="description" rows={3} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">الجلسة القادمة</label>
                <input type="date" name="nextSessionAt" className="input-field text-sm" />
              </div>
              <CaseSubmit />
              {createState.error && <p className="text-xs text-red-600">{createState.error}</p>}
            </form>
          </div>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display">متابعة الحالة — {edit.studentName}</h3>
              <button type="button" onClick={() => setEdit(null)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form action={updateAction} className="space-y-3">
              <input type="hidden" name="caseId" value={edit.id} />
              <div>
                <label className="block text-xs text-muted mb-1">الحالة</label>
                <select name="status" defaultValue={edit.status} className="input-field text-sm">
                  <option value="open">مفتوحة</option>
                  <option value="in_progress">قيد المتابعة</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">عدد الجلسات</label>
                <input
                  type="number"
                  name="sessions"
                  min={0}
                  defaultValue={edit.sessions}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">الجلسة القادمة</label>
                <input
                  type="date"
                  name="nextSessionAt"
                  defaultValue={edit.nextSessionAt ? edit.nextSessionAt.slice(0, 10) : ''}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">ملاحظات الجلسات</label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={edit.notes ?? ''}
                  className="input-field text-sm"
                />
              </div>
              <CaseSubmit />
              {updateState.error && <p className="text-xs text-red-600">{updateState.error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
