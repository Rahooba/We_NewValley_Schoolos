'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import { addLeave, updateLeave, deleteLeave, type ActionState } from '../actions';

const initial: ActionState = {};

const CONTRACT_LEAVE_OPTIONS = [
  { value: 'contract_excused', label: 'عذر (مع عذر)' },
  { value: 'contract_unexcused', label: 'بدون عذر' }
];
const GOVERNMENT_LEAVE_OPTIONS = [
  { value: 'government_casual', label: 'عارضة' },
  { value: 'government_regular', label: 'اعتيادي' }
];

const TYPE_AR: Record<string, string> = {
  contract_excused: 'عذر (مع عذر)',
  contract_unexcused: 'بدون عذر',
  government_casual: 'عارضة',
  government_regular: 'اعتيادي'
};

const STATUS_AR: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  APPROVED: 'موافق عليه',
  REJECTED: 'مرفوض'
};

type EmployeeOption = {
  id: string;
  fullName: string;
  employmentCategory: string;
};

type LeaveRow = {
  id: string;
  employeeName: string;
  employeeId: string;
  employmentCategory: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  createdAt: string;
};

function AddLeaveForm({ employees }: { employees: EmployeeOption[] }) {
  const [state, action] = useActionState(addLeave, initial);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const selectedEmp = employees.find((e) => e.id === selectedEmployee);
  const leaveOptions = selectedEmp?.employmentCategory === 'government'
    ? GOVERNMENT_LEAVE_OPTIONS
    : selectedEmp
    ? CONTRACT_LEAVE_OPTIONS
    : [];

  return (
    <div className="card p-4">
      <h2 className="text-sm font-medium mb-3">إضافة إجازة جديدة</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <label className="block text-xs text-muted mb-1">الموظف *</label>
          <select
            name="employeeId"
            required
            className="input-field text-sm"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">اختر الموظف</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employmentCategory === 'government' ? 'حكومي' : 'عقد'})
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div>
            <label className="block text-xs text-muted mb-1">نوع الإجازة *</label>
            <select name="leaveType" required className="input-field text-sm">
              <option value="">اختر نوع الإجازة</option>
              {leaveOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedEmployee && (
          <>
            <div>
              <label className="block text-xs text-muted mb-1">من *</label>
              <input name="startDate" type="date" required className="input-field text-sm" />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">إلى *</label>
              <input name="endDate" type="date" required className="input-field text-sm" />
            </div>
          </>
        )}

        {selectedEmployee && (
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs text-muted mb-1">السبب</label>
            <input name="reason" className="input-field text-sm" placeholder="اختياري..." />
          </div>
        )}

        {selectedEmployee && (
          <div className="sm:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary text-sm flex items-center gap-1 px-4 py-1.5">
              <Plus size={14} />
              حفظ الإجازة
            </button>
          </div>
        )}

        {state.error && <p className="text-xs text-red-600 sm:col-span-4">{state.error}</p>}
        {state.success && <p className="text-xs text-emerald-600 sm:col-span-4">تمت الإضافة</p>}
      </form>
    </div>
  );
}

type StatusSelectProps = {
  value: string;
  onChange: (v: string) => void;
};

function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <select
      name="status"
      className="input-field text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="PENDING">قيد الانتظار</option>
      <option value="APPROVED">موافق عليه</option>
      <option value="REJECTED">مرفوض</option>
    </select>
  );
}

export function LeavesPanel({
  canManage,
  employees,
  leaves
}: {
  canManage: boolean;
  employees: EmployeeOption[];
  leaves: LeaveRow[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusValues, setStatusValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [_updateState, updateAction] = useActionState(updateLeave, initial);

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(leaves.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visibleLeaves = leaves.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    setEditingId(null);
  };

  useEffect(() => {
    const initial: Record<string, string> = {};
    leaves.forEach((l) => {
      initial[l.id] = l.status;
    });
    setStatusValues(initial);
    setPage(1);
  }, [leaves]);

  if (!canManage) {
    return (
      <div className="card p-6 text-center text-muted text-sm">
        صلاحية العرض فقط — إدارة فقط للمديرين
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <AddLeaveForm employees={employees} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-4 py-2 font-medium">الموظف</th>
              <th className="px-4 py-2 font-medium">نوع الإجازة</th>
              <th className="px-4 py-2 font-medium">من</th>
              <th className="px-4 py-2 font-medium">إلى</th>
              <th className="px-4 py-2 font-medium">الحالة</th>
              <th className="px-4 py-2 font-medium">السبب</th>
              <th className="px-4 py-2 font-medium">تاريخ الإنشاء</th>
              <th className="px-4 py-2 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  لا توجد إجازات مسجلة
                </td>
              </tr>
            )}
            {visibleLeaves.map((l) => (
              <tr key={l.id} className="border-t border-border align-top">
                <td className="px-4 py-2">{l.employeeName}</td>
                <td className="px-4 py-2">{TYPE_AR[l.leaveType] ?? l.leaveType}</td>
                <td className="px-4 py-2 whitespace-nowrap">{l.startDate}</td>
                <td className="px-4 py-2 whitespace-nowrap">{l.endDate}</td>
                <td className="px-4 py-2">
                  {editingId === l.id ? (
                    <StatusSelect
                      value={statusValues[l.id] ?? l.status}
                      onChange={(v) => setStatusValues((prev) => ({ ...prev, [l.id]: v }))}
                    />
                  ) : (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : l.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {STATUS_AR[l.status] ?? l.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{l.reason || '—'}</td>
                <td className="px-4 py-2 text-muted whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-4 py-2">
                  {editingId === l.id ? (
                    <form action={updateAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="status" value={statusValues[l.id] ?? l.status} />
                      <button type="submit" className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand">
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-muted hover:text-ink"
                      >
                        إلغاء
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(l.id)}
                      className="text-xs text-brand border border-border rounded-sm px-2 py-1 hover:border-brand"
                    >
                      تعديل
                    </button>
                  )}
                  <DeleteButton onDelete={() => deleteLeave(l.id)} />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 border-t border-border" dir="rtl">
            <button
              type="button"
              disabled={current <= 1}
              onClick={() => goToPage(current - 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-surface hover:border-brand disabled:opacity-40 disabled:pointer-events-none"
            >
              السابق
            </button>
            <span className="text-xs text-muted">
              {current} / {totalPages}
            </span>
            <button
              type="button"
              disabled={current >= totalPages}
              onClick={() => goToPage(current + 1)}
              className="text-xs px-3 py-1.5 rounded-md border border-border bg-surface hover:border-brand disabled:opacity-40 disabled:pointer-events-none"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
