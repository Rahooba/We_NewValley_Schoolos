'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import {
  updateCommittee,
  deleteCommittee,
  updateMember,
  deleteMember,
  updateMeeting,
  deleteMeeting,
  addTask,
  updateTask,
  deleteTask,
  type ActionState
} from './actions';

const initial: ActionState = {};
const taskStatusOptions = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'منفذة' }
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG');
}

function SaveInline() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : 'حفظ'}
    </button>
  );
}

function AddTaskButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
      إضافة
    </button>
  );
}

function MeetingBlock({ meeting, canManage }: { meeting: any; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateMeeting, initial);
  const [taskState, taskAction] = useActionState(addTask, initial);
  const [addingTask, setAddingTask] = useState(false);

  return (
    <div className="border border-border rounded-sm p-3">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <form action={action} className="flex items-center gap-1 flex-1">
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="committeeId" value={meeting.committeeId} />
            <input type="date" name="date" required defaultValue={meeting.date.slice(0, 10)} className="input-field text-xs w-32" />
            <input name="agenda" defaultValue={meeting.agenda ?? ''} className="input-field text-xs flex-1" />
            <SaveInline />
          </form>
        ) : (
          <p className="text-xs">
            <span className="font-medium">{formatDate(meeting.date)}</span>
            {meeting.agenda ? ` — ${meeting.agenda}` : ''}
          </p>
        )}
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="p-1 text-muted hover:text-brand"
              title="تعديل الاجتماع"
            >
              <Pencil size={12} />
            </button>
            <DeleteButton onDelete={() => deleteMeeting(meeting.id)} />
          </div>
        )}
      </div>
      {editing && state.error && <p className="text-xs text-red-600 mt-1">{state.error}</p>}

      {meeting.tasks.length > 0 || addingTask ? (
        <div className="mt-2">
          {addingTask ? (
            <form action={taskAction} className="flex flex-wrap items-center gap-1 mb-2">
              <input type="hidden" name="meetingId" value={meeting.id} />
              <input name="title" required placeholder="عنوان المهمة" className="input-field text-xs flex-1 min-w-32" />
              <input name="assignee" placeholder="المسؤول" className="input-field text-xs w-24" />
              <input type="date" name="dueDate" className="input-field text-xs w-32" />
              <AddTaskButton />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTask(true)}
              className="text-xs text-brand hover:underline inline-flex items-center gap-1 mb-2"
            >
              <Plus size={11} /> إضافة مهمة
            </button>
          )}
          {taskState.error && <p className="text-xs text-red-600 mb-1">{taskState.error}</p>}
          <div className="space-y-1">
            {meeting.tasks.map((t: any) => (
              <TaskRow key={t.id} task={t} canManage={canManage} />
            ))}
          </div>
        </div>
      ) : canManage ? (
        <button
          type="button"
          onClick={() => setAddingTask(true)}
          className="text-xs text-brand hover:underline inline-flex items-center gap-1 mt-2"
        >
          <Plus size={11} /> إضافة مهمة
        </button>
      ) : null}
    </div>
  );
}

function TaskRow({ task, canManage }: { task: any; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateTask, initial);

  if (editing) {
    return (
      <form action={action} className="flex flex-wrap items-center gap-1">
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="meetingId" value={task.meetingId} />
        <input name="title" required defaultValue={task.title} className="input-field text-xs flex-1 min-w-32" />
        <input name="assignee" defaultValue={task.assignee ?? ''} className="input-field text-xs w-24" />
        <select name="status" defaultValue={task.status} className="input-field text-xs">
          {taskStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input type="date" name="dueDate" defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''} className="input-field text-xs w-32" />
        <SaveInline />
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-ink">
          إلغاء
        </button>
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span>
        {task.title}
        {task.assignee ? <span className="text-muted"> — {task.assignee}</span> : ''}
        {task.dueDate ? <span className="text-muted"> — {formatDate(task.dueDate)}</span> : ''}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        <span className="text-muted">{task.status}</span>
        {canManage && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="p-0.5 text-muted hover:text-brand" title="تعديل">
              <Pencil size={11} />
            </button>
            <DeleteButton onDelete={() => deleteTask(task.id)} />
          </>
        )}
      </span>
    </div>
  );
}

export function CommitteeCard({ committee, canManage }: { committee: any; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateCommittee, initial);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        {editing ? (
          <form action={action} className="flex items-center gap-1 flex-1">
            <input type="hidden" name="id" value={committee.id} />
            <input name="name" required defaultValue={committee.name} className="input-field text-sm flex-1" />
            <SaveInline />
          </form>
        ) : (
          <h3 className="font-medium">{committee.name}</h3>
        )}
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setEditing((v) => !v)} className="p-1 text-muted hover:text-brand" title="تعديل اللجنة">
              <Pencil size={14} />
            </button>
            <DeleteButton onDelete={() => deleteCommittee(committee.id)} />
          </div>
        )}
      </div>
      {editing ? (
        <input name="purpose" defaultValue={committee.purpose ?? ''} className="input-field text-xs w-full mb-3" placeholder="الغرض" />
      ) : (
        <p className="text-sm text-muted mb-3">{committee.purpose ?? '—'}</p>
      )}
      {editing && state.error && <p className="text-xs text-red-600 mb-2">{state.error}</p>}

      <p className="text-xs font-medium text-muted mb-1">الأعضاء</p>
      <ManageRows
        columns={[
          { key: 'fullName', label: 'الاسم' },
          { key: 'role', label: 'الدور' }
        ]}
        rows={committee.members.map((m: any) => ({ id: m.id, fullName: m.fullName, role: m.role ?? '' }))}
        fields={
          [
            { name: 'fullName', label: 'الاسم', type: 'text', required: true },
            { name: 'role', label: 'الدور', type: 'text' }
          ] satisfies ManageField[]
        }
        updateAction={updateMember}
        deleteAction={deleteMember}
        canEdit={canManage}
        canDelete={canManage}
        emptyText="لا يوجد أعضاء بعد"
      />

      <p className="text-xs font-medium text-muted mb-1 mt-4">الاجتماعات</p>
      <div className="space-y-2">
        {committee.meetings.map((m: any) => (
          <MeetingBlock key={m.id} meeting={m} canManage={canManage} />
        ))}
        {committee.meetings.length === 0 && <p className="text-xs text-muted">لا توجد اجتماعات بعد</p>}
      </div>
    </div>
  );
}
