'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Plus } from 'lucide-react';
import { ManageRows, type ManageActionState, type ManageField } from '@/components/ManageRows';
import {
  addContract,
  updateContract,
  deleteContract,
  addLeave,
  updateLeave,
  deleteLeave,
  addEvaluation,
  updateEvaluation,
  deleteEvaluation,
  type ActionState
} from './actions';

const initial: ActionState = {};

function AddButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary text-xs px-3 py-1.5">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      {label}
    </button>
  );
}

function Field({ name, label, type = 'text', children }: { name: string; label: string; type?: string; children?: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {children ?? <input name={name} type={type} className="input-field text-sm" />}
    </div>
  );
}

function ContractSection({ employeeId, contracts }: { employeeId: string; contracts: any[] }) {
  const [state, action] = useActionState(addContract, initial);

  const rows = contracts.map((c) => ({
    id: c.id,
    startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : '',
    salary: String(Number(c.salary)),
    type: c.type ?? ''
  }));

  const fields: ManageField[] = [
    { name: 'startDate', label: 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©', type: 'date', required: true },
    { name: 'salary', label: 'Ø§Ù„Ù…Ø±ØªØ¨', type: 'number', step: '0.01', required: true },
    { name: 'type', label: 'Ù†ÙˆØ¹ Ø§Ù„Ø¹Ù‚Ø¯', type: 'text' }
  ];

  return (
    <div className="card p-5">
      <h2 className="font-medium mb-3">Ø§Ù„Ø¹Ù‚ÙˆØ¯</h2>
      <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
        <input type="hidden" name="employeeId" value={employeeId} />
        <Field name="startDate" label="ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©" type="date" />
        <Field name="salary" label="Ø§Ù„Ù…Ø±ØªØ¨" type="number" />
        <Field name="type" label="Ù†ÙˆØ¹ Ø§Ù„Ø¹Ù‚Ø¯" />
        <AddButton label="Ø¥Ø¶Ø§ÙØ© Ø¹Ù‚Ø¯" />
        {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
      </form>
      <ManageRows
        columns={[
          { key: 'startDate', label: 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©' },
          { key: 'salary', label: 'Ø§Ù„Ù…Ø±ØªØ¨' },
          { key: 'type', label: 'Ø§Ù„Ù†ÙˆØ¹' }
        ]}
        rows={rows}
        fields={fields}
        updateAction={updateContract }
        deleteAction={(id) => deleteContract(id)}
        emptyText="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù‚ÙˆØ¯"
      />
    </div>
  );
}

const CONTRACT_LEAVE_OPTIONS = [
  { value: 'contract_excused', label: 'عذر (مع عذر)' },
  { value: 'contract_unexcused', label: 'بدون عذر' }
];
const GOVERNMENT_LEAVE_OPTIONS = [
  { value: 'government_casual', label: 'عارضة' },
  { value: 'government_regular', label: 'اعتيادي' }
];

function LeaveSection({
  employeeId,
  leaves,
  employmentCategory
}: { employeeId: string; leaves: any[]; employmentCategory: string }) {
  const [state, action] = useActionState(addLeave, initial);
  const statusAr: Record<string, string> = { PENDING: 'قيد الانتظار', APPROVED: 'موافق عليه', REJECTED: 'مرفوض' };
  const typeAr: Record<string, string> = {
    contract_excused: 'عذر (مع عذر)',
    contract_unexcused: 'بدون عذر',
    government_casual: 'عارضة',
    government_regular: 'اعتيادي'
  };
  const leaveOptions = employmentCategory === 'government' ? GOVERNMENT_LEAVE_OPTIONS : CONTRACT_LEAVE_OPTIONS;

  const rows = leaves.map((l) => ({
    id: l.id,
    leaveType: l.leaveType,
    startDate: l.startDate.toISOString().slice(0, 10),
    endDate: l.endDate.toISOString().slice(0, 10),
    status: l.status,
    reason: l.reason ?? ''
  }));

  const fields: ManageField[] = [
    { name: 'leaveType', label: 'نوع الإجازة', type: 'select', options: leaveOptions, required: true },
    { name: 'startDate', label: 'من', type: 'date', required: true },
    { name: 'endDate', label: 'إلى', type: 'date', required: true },
    { name: 'status', label: 'الحالة', type: 'select', options: [
      { value: 'PENDING', label: 'قيد الانتظار' },
      { value: 'APPROVED', label: 'موافق عليه' },
      { value: 'REJECTED', label: 'مرفوض' }
    ]},
    { name: 'reason', label: 'السبب', type: 'text', full: true }
  ];

  return (
    <div className="card p-5">
      <h2 className="font-medium mb-3">الإجازات</h2>
      <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
        <input type="hidden" name="employeeId" value={employeeId} />
        <div>
          <label className="block text-xs text-muted mb-1">نوع الإجازة</label>
          <select name="leaveType" required className="input-field text-sm">
            {leaveOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Field name="startDate" label="من" type="date" />
        <Field name="endDate" label="إلى" type="date" />
        <Field name="reason" label="السبب" />
        <AddButton label="إضافة إجازة" />
        {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
      </form>
      <ManageRows
        columns={[
          { key: 'leaveType', label: 'النوع' },
          { key: 'startDate', label: 'من' },
          { key: 'endDate', label: 'إلى' },
          {
            key: 'status',
            label: 'الحالة',
            render: (row) => (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  row.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : row.status === 'REJECTED'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {statusAr[row.status] ?? row.status}
              </span>
            )
          }
        ]}
        rows={rows}
        fields={fields}
        getValue={(row, field) => field.name === 'leaveType' ? (typeAr[row.leaveType] ?? row.leaveType) : String(row[field.name] ?? '')}
        updateAction={updateLeave }
        deleteAction={(id) => deleteLeave(id)}
        emptyText="لا توجد إجازات"
      />
    </div>
  );
}

function EvaluationSection({ employeeId, evaluations }: { employeeId: string; evaluations: any[] }) {
  const [state, action] = useActionState(addEvaluation, initial);

  const rows = evaluations.map((e) => ({
    id: e.id,
    period: e.period,
    score: String(Number(e.score)),
    notes: e.notes ?? ''
  }));

  const fields: ManageField[] = [
    { name: 'period', label: 'Ø§Ù„ÙØªØ±Ø©', type: 'text', required: true },
    { name: 'score', label: 'Ø§Ù„Ø¯Ø±Ø¬Ø© (100)', type: 'number', step: '0.01', required: true },
    { name: 'notes', label: 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª', type: 'textarea', full: true }
  ];

  return (
    <div className="card p-5">
      <h2 className="font-medium mb-3">Ø§Ù„ØªÙ‚ÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙˆØ±ÙŠØ©</h2>
      <form action={action} className="flex flex-wrap items-end gap-2 mb-4">
        <input type="hidden" name="employeeId" value={employeeId} />
        <Field name="period" label="Ø§Ù„ÙØªØ±Ø©" />
        <Field name="score" label="Ø§Ù„Ø¯Ø±Ø¬Ø© (100)" type="number" />
        <Field name="notes" label="Ù…Ù„Ø§Ø­Ø¸Ø§Øª" />
        <AddButton label="Ø¥Ø¶Ø§ÙØ© ØªÙ‚ÙŠÙ…" />
        {state.error && <p className="text-xs text-red-600 w-full">{state.error}</p>}
      </form>
      <ManageRows
        columns={[
          { key: 'period', label: 'Ø§Ù„ÙØªØ±Ø©' },
          { key: 'score', label: 'Ø§Ù„Ø¯Ø±Ø¬Ø©' },
          { key: 'notes', label: 'Ù…Ù„Ø§Ø­Ø¸Ø§Øª' }
        ]}
        rows={rows}
        fields={fields}
        updateAction={updateEvaluation }
        deleteAction={(id) => deleteEvaluation(id)}
        emptyText="Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ‚ÙŠÙ…Ø§Øª"
      />
    </div>
  );
}

export function EmployeeSections({
  employeeId,
  contracts,
  leaves,
  evaluations,
  employmentCategory
}: {
  employeeId: string;
  contracts: any[];
  leaves: any[];
  evaluations: any[];
  employmentCategory: string;
}) {
  return (
    <div className="space-y-6">
      <ContractSection employeeId={employeeId} contracts={contracts} />
      <LeaveSection employeeId={employeeId} leaves={leaves} employmentCategory={employmentCategory} />
      <EvaluationSection employeeId={employeeId} evaluations={evaluations} />
    </div>
  );
}

