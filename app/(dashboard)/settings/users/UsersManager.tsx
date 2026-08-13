'use client';

import { Fragment, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { updateUserAccess, type UsersActionState } from './actions';

const initial: UsersActionState = {};

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt: string | null;
};

type RoleOption = {
  id: string;
  code: string;
  name: string;
  level: number;
  permissionCount: number;
};

function EditForm({ user, roles, myUserId }: { user: UserRow; roles: RoleOption[]; myUserId: string }) {
  const [state, action] = useActionState(updateUserAccess, initial);
  const { pending } = useFormStatus();

  if (user.id === myUserId) {
    return (
      <div className="text-sm text-muted px-4 py-3">
        هذا حسابك الحالي — عدّل الإيميل وكلمة المرور من{' '}
        <Link href="/settings/profile" className="text-brand hover:underline">
          الملف الشخصي
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end px-4 py-4">
      <input type="hidden" name="userId" value={user.id} />
      <div>
        <label className="block text-xs text-muted mb-1">الدور (الصلاحيات)</label>
        <select name="roleId" defaultValue={user.roleId} className="input-field text-sm">
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.permissionCount} صلاحية)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">الحالة</label>
        <select name="status" defaultValue={user.status} className="input-field text-sm">
          <option value="ACTIVE">نشط</option>
          <option value="INACTIVE">معطل</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">كلمة مرور جديدة (اختياري)</label>
        <input name="newPassword" type="password" minLength={8} className="input-field text-sm" placeholder="8 أحرف على الأقل" />
      </div>
      <div className="flex flex-col gap-1">
        <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          حفظ التعديل
        </button>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-600">{state.success}</p>}
      </div>
    </form>
  );
}

export function UsersManager({
  users,
  roles,
  myUserId,
  page = 1,
  totalUsers,
  searchParams = {}
}: {
  users: UserRow[];
  roles: RoleOption[];
  myUserId: string;
  page?: number;
  totalUsers?: number;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil((totalUsers ?? users.length) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">إدارة المستخدمين</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">البريد الإلكتروني</th>
              <th className="px-4 py-3 font-medium">الدور</th>
              <th className="px-4 py-3 font-medium">آخر دخول</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr className="border-t border-border">
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3" dir="ltr">{u.email}</td>
                  <td className="px-4 py-3">{u.roleName}</td>
                  <td className="px-4 py-3">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'ACTIVE' ? (
                      <span className="text-emerald-600">نشط</span>
                    ) : (
                      <span className="text-red-600">معطل</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <button
                      onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                      className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                    >
                      {expanded === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expanded === u.id ? 'إغلاق' : 'تعديل الصلاحيات'}
                    </button>
                  </td>
                </tr>
                {expanded === u.id && (
                  <tr className="border-t border-border bg-paper/50">
                    <td colSpan={6}>
                      <EditForm user={u} roles={roles} myUserId={myUserId} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
      </div>
    </div>
  );
}
