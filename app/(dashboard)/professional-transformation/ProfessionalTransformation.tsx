'use client';

import { useMemo, useTransition, useState } from 'react';
import { Clock, Loader2, Plus, X } from 'lucide-react';
import { StudentPicker } from '@/components/StudentPicker';
import { DeleteButton } from '@/components/DeleteButton';
import {
  createEmployeeBehavior,
  createStudentBehavior,
  deleteStudentBehavior,
  deleteEmployeeBehavior
} from './actions';

export type LateRecord = {
  id: string;
  date: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  note?: string | null;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
};

export type BehaviorRecord = {
  id: string;
  type: string;
  description: string;
  studentName?: string;
  employeeName?: string;
  createdAt: string;
};

type StudentItem = { id: string; fullName: string; studentCode?: string; className?: string };
type EmployeeItem = { id: string; fullName: string };

const TYPE_META: Record<string, { label: string; cls: string }> = {
  positive: { label: 'إيجابي', cls: 'bg-emerald-50 text-emerald-700' },
  negative: { label: 'سلبي', cls: 'bg-red-50 text-red-700' },
  tardiness: { label: 'تأخير', cls: 'bg-amber-50 text-amber-700' }
};

const TABS = [
  { id: 'students', label: 'تأخيرات الطلاب' },
  { id: 'behavior', label: 'الرصد السلوكي' }
] as const;

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function ProfessionalTransformation({
  studentLate,
  studentBehavior,
  employeeBehavior,
  students,
  employees
}: {
  studentLate: LateRecord[];
  studentBehavior: BehaviorRecord[];
  employeeBehavior: BehaviorRecord[];
  students: StudentItem[];
  employees: EmployeeItem[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('students');
  const [sFrom, setSFrom] = useState('');
  const [sTo, setSTo] = useState('');
  const [sClass, setSClass] = useState('');
  const [behaviorOpen, setBehaviorOpen] = useState(false);
  const [kind, setKind] = useState<'student' | 'employee'>('student');
  const [behaviorError, setBehaviorError] = useState('');
  const [pending, startTransition] = useTransition();

  const classNames = useMemo(
    () => Array.from(new Set(studentLate.map((r) => r.className ?? '—').filter((c) => c !== '—'))).sort(),
    [studentLate]
  );

  const filteredStudents = studentLate.filter((r) => {
    const d = r.date.slice(0, 10);
    if (sFrom && d < sFrom) return false;
    if (sTo && d > sTo) return false;
    if (sClass && r.className !== sClass) return false;
    return true;
  });

  const behavior = useMemo(() => {
    const list: { id: string; who: string; type: string; description: string; createdAt: string; scope: string }[] = [
      ...studentBehavior.map((b) => ({ id: b.id, who: b.studentName ?? '', type: b.type, description: b.description, createdAt: b.createdAt, scope: 'طالب' })),
      ...employeeBehavior.map((b) => ({ id: b.id, who: b.employeeName ?? '', type: b.type, description: b.description, createdAt: b.createdAt, scope: 'موظف' }))
    ];
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [studentBehavior, employeeBehavior]);

  function submitBehavior(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBehaviorError('');
    startTransition(async () => {
      const res = kind === 'student' ? await createStudentBehavior({}, fd) : await createEmployeeBehavior({}, fd);
      if (res.error) setBehaviorError(res.error);
      else setBehaviorOpen(false);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm rounded-sm transition-colors ${
              tab === t.id ? 'bg-brand text-white' : 'bg-surface border border-border hover:border-brand'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="card p-4">
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div>
              <label className="block text-xs text-muted mb-1">من تاريخ</label>
              <input type="date" className="input-field text-sm" value={sFrom} onChange={(e) => setSFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">إلى تاريخ</label>
              <input type="date" className="input-field text-sm" value={sTo} onChange={(e) => setSTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">الفصل</label>
              <select className="input-field text-sm" value={sClass} onChange={(e) => setSClass(e.target.value)}>
                <option value="">الكل</option>
                {classNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">التاريخ</th>
                  <th className="px-4 py-2 font-medium">الكود</th>
                  <th className="px-4 py-2 font-medium">الطالب</th>
                  <th className="px-4 py-2 font-medium">الفصل</th>
                  <th className="px-4 py-2 font-medium">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2">{new Date(r.date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-2 text-muted">{r.studentCode}</td>
                    <td className="px-4 py-2 font-medium">{r.studentName}</td>
                    <td className="px-4 py-2 text-muted">{r.className}</td>
                    <td className="px-4 py-2 text-muted">{r.note || '—'}</td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      لا توجد تأخيرات مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'behavior' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setBehaviorOpen(true)} className="btn-primary">
              <Plus size={16} /> رصد سلوكي جديد
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الجهة</th>
                  <th className="px-4 py-2 font-medium">الاسم</th>
                  <th className="px-4 py-2 font-medium">النوع</th>
                  <th className="px-4 py-2 font-medium">الوصف</th>
                  <th className="px-4 py-2 font-medium">التاريخ</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {behavior.map((b) => {
                  const meta = TYPE_META[b.type] ?? TYPE_META.negative;
                  return (
                    <tr key={`${b.scope}-${b.id}`} className="border-t border-border">
                      <td className="px-4 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-paper border border-border">{b.scope}</span>
                      </td>
                      <td className="px-4 py-2 font-medium">{b.who}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-2">{b.description}</td>
                      <td className="px-4 py-2 text-muted">
                        {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-2">
                        <DeleteButton
                          onDelete={() =>
                            b.scope === 'طالب'
                              ? deleteStudentBehavior(b.id)
                              : deleteEmployeeBehavior(b.id)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
                {behavior.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">
                      لا توجد سجلات سلوكية بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {behaviorOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display">رصد سلوكي جديد</h3>
              <button type="button" onClick={() => setBehaviorOpen(false)} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitBehavior} className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">الجهة</label>
                <select
                  className="input-field text-sm"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'student' | 'employee')}
                >
                  <option value="student">طالب</option>
                  <option value="employee">موظف</option>
                </select>
              </div>
              {kind === 'student' ? (
                <div>
                  <label className="block text-xs text-muted mb-1">الطالب</label>
                  <StudentPicker students={students} name="studentId" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-muted mb-1">الموظف</label>
                  <select name="employeeId" required className="input-field text-sm">
                    <option value="">— اختر الموظف —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-muted mb-1">النوع</label>
                <select name="type" required className="input-field text-sm">
                  <option value="positive">إيجابي</option>
                  <option value="negative">سلبي</option>
                  <option value="tardiness">تأخير</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">الوصف</label>
                <textarea name="description" rows={3} required className="input-field text-sm" />
              </div>
              <button type="submit" disabled={pending} className="btn-primary w-full">
                {pending ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                حفظ الرصد
              </button>
              {behaviorError && <p className="text-xs text-red-600">{behaviorError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
