'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Clock, Loader2, Plus, X } from 'lucide-react';
import { setLessonPlanDueDate, type ActionState } from '../../actions';
import { isoWeekYear, weeksRange, type WeekInfo } from '@/lib/weeks';

type Plan = {
  id: string;
  teacherId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  weekNumber: number | null;
  weekOf: string;
  dueDate: string;
  submittedAt: string | null;
  fileUrl: string | null;
  fileHref: string | null;
};

type Teacher = { id: string; fullName: string };
type Subject = { id: string; name: string };

const initial: ActionState = {};

function weekKey(plan: Plan): string {
  return `${isoWeekYear(new Date(plan.weekOf))}-${plan.weekNumber ?? 0}`;
}

function DueDateSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
      حفظ الموعد
    </button>
  );
}

function DueDateDialog({
  open,
  onClose,
  teacherId,
  weekOf,
  teachers,
  subjects,
  weeks,
  defaultSubjectId
}: {
  open: boolean;
  onClose: () => void;
  teacherId?: string;
  weekOf?: string;
  teachers: Teacher[];
  subjects: Subject[];
  weeks: WeekInfo[];
  defaultSubjectId?: string;
}) {
  const [state, action] = useActionState(setLessonPlanDueDate, initial);
  const [selectedWeek, setSelectedWeek] = useState(
    weekOf ?? weeks[weeks.length - 1]?.mondayISO ?? ''
  );
  const [dueDate, setDueDate] = useState(() => {
    const end = weekOf ? new Date(`${weekOf}T23:59:00`) : new Date();
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(
      end.getDate()
    ).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display">تحديد موعد تسليم الخطة</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <form action={action} className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">المعلم</label>
            <select
              name="teacherId"
              required
              className="input-field text-sm"
              defaultValue={teacherId ?? ''}
            >
              <option value="">— اختر المعلم —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">المادة</label>
            <select
              name="subjectId"
              required
              className="input-field text-sm"
              defaultValue={defaultSubjectId ?? ''}
            >
              <option value="">— اختر المادة —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الأسبوع</label>
            <select
              name="weekOf"
              required
              className="input-field text-sm"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {weeks.map((w) => (
                <option key={w.mondayISO} value={w.mondayISO}>
                  {w.label} ({w.rangeLabel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">عنوان الخطة</label>
            <input name="title" required className="input-field text-sm" placeholder="خطة أسبوع..." />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الموعد النهائي</label>
            <input
              type="date"
              name="dueDate"
              required
              className="input-field text-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <DueDateSubmit />
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}

export function LessonPlansOverview({
  canManage,
  teachers,
  subjects,
  schedules,
  plans
}: {
  canManage: boolean;
  teachers: Teacher[];
  subjects: Subject[];
  schedules: { teacherId: string; className: string }[];
  plans: Plan[];
}) {
  const weeks = weeksRange(-4, 2);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [weekFrom, setWeekFrom] = useState(0);
  const [weekTo, setWeekTo] = useState(weeks.length - 1);
  const [dialog, setDialog] = useState<{ teacherId: string; weekOf: string; subjectId?: string } | null>(null);

  const classNames = useMemo(
    () => Array.from(new Set(schedules.map((s) => s.className).filter(Boolean))).sort(),
    [schedules]
  );

  const plansByCell = useMemo(() => {
    const map = new Map<string, Plan[]>();
    for (const p of plans) {
      const key = `${p.teacherId}|${weekKey(p)}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [plans]);

  const visibleWeeks = useMemo(
    () => weeks.slice(Math.min(weekFrom, weekTo), Math.max(weekFrom, weekTo) + 1),
    [weeks, weekFrom, weekTo]
  );

  const visibleTeachers = useMemo(() => {
    const tq = teacherFilter.trim().toLowerCase();
    return teachers.filter((t) => {
      if (tq && !t.fullName.toLowerCase().includes(tq)) return false;
      if (classFilter) {
        const teacherClasses = new Set(
          schedules.filter((s) => s.teacherId === t.id).map((s) => s.className)
        );
        if (!teacherClasses.has(classFilter)) return false;
      }
      return true;
    });
  }, [teachers, teacherFilter, classFilter, schedules]);

  function cellPlans(teacherId: string, week: WeekInfo): Plan[] {
    return (plansByCell.get(`${teacherId}|${week.year}-${week.week}`) ?? []).filter((p) =>
      subjectFilter ? p.subjectId === subjectFilter : true
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setDialog({ teacherId: '', weekOf: '' })}
            className="btn-primary"
          >
            <Plus size={16} /> تحديد موعد تسليم جديد
          </button>
          <p className="text-xs text-muted">
            حدد معلمًا ومادة وأسبوعًا وموعدًا نهائيًا، وسيظهر للمعلم ليرفع خطته قبل الموعد.
          </p>
        </div>
      )}

      <div className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs text-muted mb-1">البحث عن معلم</label>
          <input
            className="input-field text-sm"
            placeholder="اسم المعلم..."
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">المادة</label>
          <select
            className="input-field text-sm"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">الكل</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">الفصل</label>
          <select
            className="input-field text-sm"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">الكل</option>
            {classNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-muted mb-1">من أسبوع</label>
            <select
              className="input-field text-sm"
              value={weekFrom}
              onChange={(e) => setWeekFrom(Number(e.target.value))}
            >
              {weeks.map((w, i) => (
                <option key={w.mondayISO} value={i}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">إلى أسبوع</label>
            <select
              className="input-field text-sm"
              value={weekTo}
              onChange={(e) => setWeekTo(Number(e.target.value))}
            >
              {weeks.map((w, i) => (
                <option key={w.mondayISO} value={i}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-paper text-muted text-right">
            <tr>
              <th className="px-3 py-3 font-medium sticky right-0 bg-paper">المعلم</th>
              {visibleWeeks.map((w) => (
                <th key={w.mondayISO} className="px-3 py-3 font-medium text-center">
                  {w.label}
                  <div className="text-[10px] font-normal text-muted" dir="ltr">
                    {w.rangeLabel}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTeachers.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium sticky right-0 bg-surface">{t.fullName}</td>
                {visibleWeeks.map((w) => {
                  const cell = cellPlans(t.id, w);
                  if (cell.length === 0) {
                    return (
                      <td key={w.mondayISO} className="px-3 py-2 text-center text-muted">
                        {canManage ? (
                          <button
                            type="button"
                            title="تحديد موعد تسليم لهذا المعلم"
                            onClick={() => setDialog({ teacherId: t.id, weekOf: w.mondayISO })}
                            className="text-brand hover:bg-paper rounded-sm p-1"
                          >
                            <Plus size={14} />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={w.mondayISO} className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {cell.map((p) => {
                          const late = !p.submittedAt && new Date(p.dueDate) < new Date();
                          if (p.submittedAt && p.fileUrl && p.fileHref) {
                            return (
                              <a
                                key={p.id}
                                href={p.fileHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${p.subjectName} — ${p.title} (تم الرفع)`}
                                className="text-emerald-600 hover:underline flex items-center gap-1"
                              >
                                <Check size={15} /> {p.subjectName}
                              </a>
                            );
                          }
                          return (
                            <span
                              key={p.id}
                              title={`${p.subjectName} — ${p.title}${late ? ' (متأخرة)' : ' (بانتظار الرفع)'}`}
                              className={`flex items-center gap-1 ${late ? 'text-red-500' : 'text-amber-500'}`}
                            >
                              {late ? '✗' : <Clock size={13} />} {p.subjectName}
                            </span>
                          );
                        })}
                        {canManage && (
                          <button
                            type="button"
                            title="تعديل الموعد"
                            onClick={() =>
                              setDialog({
                                teacherId: t.id,
                                weekOf: w.mondayISO,
                                subjectId: cell[0].subjectId
                              })
                            }
                            className="text-muted hover:text-brand text-[10px] flex items-center gap-0.5"
                          >
                            <Plus size={11} /> موعد
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleTeachers.length === 0 && (
              <tr>
                <td colSpan={visibleWeeks.length + 1} className="px-4 py-8 text-center text-muted">
                  لا يوجد معلمون مطابقون للفلترة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 text-xs text-muted flex-wrap">
        <span className="flex items-center gap-1"><Check size={13} className="text-emerald-600" /> تم الرفع</span>
        <span className="flex items-center gap-1"><Clock size={13} className="text-amber-500" /> بانتظار الرفع</span>
        <span className="flex items-center gap-1"><span className="text-red-500">✗</span> متأخرة</span>
        <span className="flex items-center gap-1"><span className="text-muted">—</span> لا توجد خطة مطلوبة</span>
      </div>

      <DueDateDialog
        key={dialog ? `${dialog.teacherId}|${dialog.weekOf}` : 'closed'}
        open={dialog !== null}
        onClose={() => setDialog(null)}
        teacherId={dialog?.teacherId}
        weekOf={dialog?.weekOf}
        defaultSubjectId={dialog?.subjectId}
        teachers={teachers}
        subjects={subjects}
        weeks={weeks}
      />
    </div>
  );
}
