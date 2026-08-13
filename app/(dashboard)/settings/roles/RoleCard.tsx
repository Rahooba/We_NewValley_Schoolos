'use client';

import { useActionState, useTransition, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Pencil } from 'lucide-react';
import { updateRole, toggleRolePermission, type ActionState } from './actions';

const initial: ActionState = {};

function SaveInline() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-2 py-1">
      {pending ? <Loader2 size={12} className="animate-spin" /> : 'حفظ'}
    </button>
  );
}

type RolePermissionItem = { id: string; permissionId: string; permissionKey: string; module: string };
type PermissionItem = { id: string; permissionKey: string; module: string };

export function RoleCard({
  role,
  permissions
}: {
  role: {
    id: string;
    name: string;
    description: string | null;
    level: number;
    code: string;
    permissions: RolePermissionItem[];
  };
  permissions: PermissionItem[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateRole, initial);
  const [pending, startTransition] = useTransition();

  const granted = new Set(role.permissions.map((p) => p.permissionId));
  const grouped = permissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  function toggle(permissionId: string, add: boolean) {
    startTransition(() => toggleRolePermission(role.id, permissionId, add));
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        {editing ? (
          <form action={action} className="flex items-center gap-1 flex-1">
            <input type="hidden" name="id" value={role.id} />
            <input name="name" required defaultValue={role.name} className="input-field text-sm flex-1" />
            <SaveInline />
          </form>
        ) : (
          <h2 className="font-medium">{role.name}</h2>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted">{role.code} · Level {role.level}</span>
          <button type="button" onClick={() => setEditing((v) => !v)} className="p-1 text-muted hover:text-brand" title="تعديل">
            <Pencil size={14} />
          </button>
        </div>
      </div>
      {editing && (
        <input
          name="description"
          defaultValue={role.description ?? ''}
          className="input-field text-xs w-full mb-2"
          placeholder="الوصف"
        />
      )}
      {!editing && <p className="text-sm text-muted mb-3">{role.description ?? '—'}</p>}
      {editing && state.error && <p className="text-xs text-red-600 mb-2">{state.error}</p>}

      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {Object.entries(grouped).map(([module, perms]) => (
          <div key={module}>
            <p className="text-xs font-medium text-muted mb-1">{module}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {perms.map((p) => {
                const on = granted.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 text-xs rounded-sm px-2 py-1 cursor-pointer border ${
                      on ? 'bg-brand/5 border-brand/30' : 'border-border'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                      className="accent-brand"
                    />
                    <span className="text-muted">{p.permissionKey}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {pending && (
        <p className="text-xs text-muted mt-2 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> جارٍ الحفظ...
        </p>
      )}
    </div>
  );
}
