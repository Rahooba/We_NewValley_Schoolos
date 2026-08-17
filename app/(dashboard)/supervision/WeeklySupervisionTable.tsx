'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, Loader2 } from 'lucide-react';
import { DeleteButton } from '@/components/DeleteButton';
import { createSupervision, deleteSupervision, type ActionState } from './actions';

const initial: ActionState = {};

export interface WeekDayCell {
  dateISO: string;
  label: string;
  isToday: boolean;
  supervisors: {
    id: string;
    name: string;
    isGeneralSupervisor: boolean;
    area: string | null;
    pointsCount: number;
  }[];
  assignable: { id: string; label: string }[];
}

function AssignButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-brand border border-border rounded-sm px-2 py-1 flex items-center gap-1 hover:border-brand disabled:opacity-50"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
      تعيين
    </button>
  );
}

// One form per day-column: each cell saves independently via the same
// createSupervision action as the daily view (no parallel action).
function WeekDayAssignForm({
  dateISO,
  assignable
}: {
  dateISO: string;
  assignable: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createSupervision, initial);
  return (
    <form action={action} className="mt-2 pt-2 border-t border-border space-y-2">
      <input type="hidden" name="date" value={dateISO} />
      <select
        name="employeeId"
        required
        defaultValue=""
        className="w-full text-xs bg-transparent border border-border rounded-sm px-2 py-1 focus:border-brand outline-none"
      >
        <option value="" disabled>
          — اختر مشرفًا —
        </option>
        {assignable.map((e) => (
          <option key={e.id} value={e.id}>
            {e.label}
          </option>
        ))}
      </select>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
          <input type="checkbox" name="isGeneralSupervisor" className="accent-indigo-600" />
          مشرف عام
        </label>
        <AssignButton />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function WeeklySupervisionTable({
  days,
  canManage
}: {
  days: WeekDayCell[];
  canManage: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-paper text-muted">
            <tr>
              {days.map((d) => (
                <th key={d.dateISO} className="px-3 py-2 font-medium text-center align-top">
                  <span className={d.isToday ? 'text-brand' : ''}>{d.label}</span>
                  {d.isToday && <span className="block text-[10px] text-brand mt-0.5">اليوم</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {days.map((d) => (
                <td key={d.dateISO} className="border-r border-border px-3 py-3 align-top">
                  {d.supervisors.length === 0 && (
                    <p className="text-xs text-muted text-center py-1">لا يوجد مشرف</p>
                  )}
                  {d.supervisors.map((s) => (
                    <div key={s.id} className="mb-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium">{s.name}</span>
                        {canManage && (
                          <DeleteButton onDelete={deleteSupervision.bind(null, s.id)} />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {s.isGeneralSupervisor && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5">
                            مشرف عام
                          </span>
                        )}
                        {s.area && <span className="text-[10px] text-muted">{s.area}</span>}
                        <span className="text-[10px] text-muted">{s.pointsCount} نقطة</span>
                      </div>
                    </div>
                  ))}
                  {canManage && <WeekDayAssignForm dateISO={d.dateISO} assignable={d.assignable} />}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}