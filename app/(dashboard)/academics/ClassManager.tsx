'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Pencil, Plus, X } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import {
  createClass,
  updateClass,
  deleteClass,
  createSection,
  updateSection,
  deleteSection,
  type ActionState
} from './actions';

const initial: ActionState = {};

function MiniButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

export function ClassManager({ classes }: { classes: any[] }) {
  const [createState, createAction] = useActionState(createClass, initial);
  const [updateState, updateAction] = useActionState(updateClass, initial);
  const [sectionState, sectionAction] = useActionState(createSection, initial);
  const [sectionUpdateState, sectionUpdateAction] = useActionState(updateSection, initial);
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [addingSectionTo, setAddingSectionTo] = useState<string | null>(null);

  return (
    <div>
      <form action={createAction} className="flex flex-wrap items-end gap-2 mb-4">
        <div>
          <label className="block text-xs text-muted mb-1">اسم الصف</label>
          <input name="name" required className="input-field text-sm" placeholder="الصف الأول" />
        </div>
        <MiniButton label="إضافة صف" />
        {createState.error && <p className="text-xs text-red-600 w-full">{createState.error}</p>}
      </form>

      <div className="grid sm:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              {editClassId === c.id ? (
                <form action={updateAction} className="flex items-center gap-1 flex-1">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="name"
                    required
                    defaultValue={c.name}
                    className="input-field text-sm flex-1"
                  />
                  <SaveInline />
                </form>
              ) : (
                <p className="font-medium">{c.name}</p>
              )}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditClassId(editClassId === c.id ? null : c.id)}
                  className="p-1 text-muted hover:text-brand"
                  title="تعديل اسم الصف"
                >
                  <Pencil size={14} />
                </button>
                <DeleteButton onDelete={() => deleteClass(c.id)} />
              </div>
            </div>
            {editClassId === c.id && updateState.error && (
              <p className="text-xs text-red-600 mb-2">{updateState.error}</p>
            )}

            <div className="space-y-1 text-sm text-muted">
              {c.sections.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center gap-2">
                  {editSectionId === s.id ? (
                    <form action={sectionUpdateAction} className="flex items-center gap-1 flex-1">
                      <input type="hidden" name="id" value={s.id} />
                      <input name="name" required defaultValue={s.name} className="input-field text-sm flex-1" />
                      <SaveInline />
                    </form>
                  ) : (
                    <span>
                      فصل {s.name} — <span className="text-xs">{s._count?.students ?? 0} طالب</span>
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditSectionId(editSectionId === s.id ? null : s.id)}
                      className="p-1 text-muted hover:text-brand"
                      title="تعديل الفصل"
                    >
                      <Pencil size={12} />
                    </button>
                    <DeleteButton onDelete={() => deleteSection(s.id)} />
                  </div>
                  {editSectionId === s.id && sectionUpdateState.error && (
                    <p className="text-xs text-red-600">{sectionUpdateState.error}</p>
                  )}
                </div>
              ))}
              {c.sections.length === 0 && <p className="text-xs text-muted">لا توجد فصول بعد</p>}
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              {addingSectionTo === c.id ? (
                <form action={sectionAction} className="flex items-center gap-1">
                  <input type="hidden" name="classId" value={c.id} />
                  <input
                    name="name"
                    required
                    placeholder="اسم الفصل"
                    className="input-field text-sm flex-1"
                  />
                  <SaveInline />
                  <button
                    type="button"
                    onClick={() => setAddingSectionTo(null)}
                    className="p-1 text-muted hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingSectionTo(c.id)}
                  className="text-xs text-brand hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={12} /> إضافة فصل
                </button>
              )}
              {addingSectionTo === c.id && sectionState.error && (
                <p className="text-xs text-red-600 mt-1">{sectionState.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <p className="text-sm text-muted">لا توجد صفوف دراسية بعد — أضف أول صف</p>
      )}
    </div>
  );
}

function SaveInline() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : 'حفظ'}
    </button>
  );
}
