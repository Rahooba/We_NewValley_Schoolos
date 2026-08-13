import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PermissionGate } from '@/components/PermissionGate';
import { ManageRows, type ManageField } from '@/components/ManageRows';
import { DeleteButton } from '@/components/DeleteButton';
import { SubjectQuickForm, LessonPlanQuickForm, ScheduleQuickForm } from './QuickForms';
import { LessonPlanUploadDialog } from './LessonPlanUploadDialog';
import { ClassManager } from './ClassManager';
import {
  updateSubject,
  deleteSubject,
  updateScheduleEntry,
  deleteScheduleEntry,
  deleteLessonPlan
} from './actions';

export default async function AcademicsPage() {
  const session = await auth();
  const myEmployeeId = (session?.user as any)?.employeeId as string | null | undefined;
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canViewOverview = permissions.some((p) => ['lesson_plans.overview', 'lesson_plans.manage'].includes(p));
  const canManageFiles = permissions.includes('lesson_plans.manage');
  const canManage = permissions.includes('lesson_plans.manage');

  const [classes, subjects, lessonPlans, schedule, teachers, myPlans] = await Promise.all([
    prisma.class.findMany({
      include: { sections: { include: { _count: { select: { students: true } } } } },
      orderBy: { name: 'asc' }
    }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.lessonPlan.findMany({
      include: { subject: true, teacher: true },
      orderBy: { weekOf: 'desc' },
      take: 20
    }),
    prisma.teacherSchedule.findMany({
      include: { teacher: true },
      orderBy: [{ day: 'asc' }, { period: 'asc' }]
    }),
    prisma.employee.findMany({ where: { status: 'ACTIVE' }, orderBy: { fullName: 'asc' } }),
    myEmployeeId
      ? prisma.lessonPlan.findMany({
          where: { teacherId: myEmployeeId },
          include: { subject: true },
          orderBy: { weekOf: 'desc' }
        })
      : Promise.resolve([])
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">العملية التعليمية</h1>
        <p className="text-sm text-muted">
          الصفوف والفصول، المواد الدراسية، خطط الدرس، وجدول حصص المعلمين
        </p>
      </div>

      {/* Classes & Sections */}
      <section>
        <h2 className="text-lg font-medium mb-3">الصفوف والفصول</h2>
        {canManage ? (
          <ClassManager classes={classes} />
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4">
              {classes.map((c) => (
                <div key={c.id} className="card p-4">
                  <p className="font-medium mb-2">{c.name}</p>
                  <div className="space-y-1 text-sm text-muted">
                    {c.sections.map((s) => (
                      <div key={s.id} className="flex justify-between">
                        <span>فصل {s.name}</span>
                        <span>{s._count.students} طالب</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-2">
              التخصصات (برمجة / شبكات / اتصالات) تُحدد لكل طالب على حدة في السنة الثانية والثالثة —
              السنة الأولى عامة بدون تخصص.
            </p>
          </>
        )}
      </section>

      {/* Subjects */}
      <section>
        <h2 className="text-lg font-medium mb-3">المواد الدراسية</h2>
        <PermissionGate permission="academics.view">
          <SubjectQuickForm />
        </PermissionGate>
        <ManageRows
          columns={[
            { key: 'code', label: 'الكود' },
            { key: 'name', label: 'اسم المادة' }
          ]}
          rows={subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
          fields={
            [
              { name: 'code', label: 'الكود', type: 'text', required: true },
              { name: 'name', label: 'اسم المادة', type: 'text', required: true }
            ] satisfies ManageField[]
          }
          updateAction={updateSubject}
          deleteAction={deleteSubject}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا توجد مواد بعد"
        />
      </section>

      {/* My lesson plans (teacher view) */}
      {myEmployeeId && (
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-lg font-medium">خططي</h2>
            <LessonPlanUploadDialog subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
                <tr>
                  <th className="px-4 py-2 font-medium">الأسبوع</th>
                  <th className="px-4 py-2 font-medium">المادة</th>
                  <th className="px-4 py-2 font-medium">العنوان</th>
                  <th className="px-4 py-2 font-medium">الموعد النهائي</th>
                  <th className="px-4 py-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {myPlans.map((lp) => {
                  const isLate = !lp.submittedAt && new Date(lp.dueDate) < new Date();
                  return (
                    <tr key={lp.id} className="border-t border-border">
                      <td className="px-4 py-2">{new Date(lp.weekOf).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-2">{lp.subject.name}</td>
                      <td className="px-4 py-2">{lp.title}</td>
                      <td className="px-4 py-2">{new Date(lp.dueDate).toLocaleDateString('ar-EG')}</td>
                      <td className="px-4 py-2">
                        {lp.submittedAt ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            تم الرفع ✓
                          </span>
                        ) : isLate ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">متأخرة</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            بانتظار الرفع
                          </span>
                        )}
                        {lp.fileUrl && (
                          <a
                            href={`/api/lesson-plans/file?planId=${lp.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand hover:underline mr-2"
                          >
                            عرض الخطة
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {myPlans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      لا توجد خطط بعد — استخدم زر &quot;رفع الخطة&quot; لتسليم خطة هذا الأسبوع.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Lesson plans (all, director view) */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-medium">خطط الدرس</h2>
          <div className="flex items-center gap-2">
            {canManageFiles && (
              <Link href="/academics/files" className="btn-primary text-xs px-3 py-1.5">
                <FolderOpen size={14} />
                إدارة الملفات المرفوعة
              </Link>
            )}
            {canViewOverview && (
              <Link
                href="/academics/lesson-plans/overview"
                className="text-sm text-brand hover:underline"
              >
                متابعة خطط الدروس (لوحة المدير) ←
              </Link>
            )}
          </div>
        </div>
        <p className="text-xs text-muted mb-3">
          المدير الأكاديمي يحدد المادة والمعلم والموعد النهائي، والمعلم يرفع خطته الخاصة قبل الموعد.
        </p>
        <PermissionGate permission="lesson_plans.manage">
          <LessonPlanQuickForm
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            teachers={teachers.map((t) => ({ id: t.id, fullName: t.fullName }))}
          />
        </PermissionGate>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">الأسبوع</th>
                <th className="px-4 py-2 font-medium">المادة</th>
                <th className="px-4 py-2 font-medium">المعلم</th>
                <th className="px-4 py-2 font-medium">العنوان</th>
                <th className="px-4 py-2 font-medium">الموعد النهائي</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                {canManage && <th className="px-4 py-2 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {lessonPlans.map((lp) => {
                const isLate = !lp.submittedAt && new Date(lp.dueDate) < new Date();
                return (
                  <tr key={lp.id} className="border-t border-border">
                    <td className="px-4 py-2">{new Date(lp.weekOf).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-2">{lp.subject.name}</td>
                    <td className="px-4 py-2">{lp.teacher.fullName}</td>
                    <td className="px-4 py-2">{lp.title}</td>
                    <td className="px-4 py-2">{new Date(lp.dueDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-2">
                      {lp.submittedAt ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          تم الرفع ✓
                        </span>
                      ) : isLate ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">متأخرة</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          بانتظار الرفع
                        </span>
                      )}
                      {lp.submittedAt && lp.fileUrl && canViewOverview && (
                        <div className="mt-1">
                          <a
                            href={`/api/lesson-plans/file?planId=${lp.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand hover:underline"
                          >
                            عرض الخطة
                          </a>
                        </div>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <DeleteButton onDelete={deleteLessonPlan.bind(null, lp.id)} />
                      </td>
                    )}
                  </tr>
                );
              })}
              {lessonPlans.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-6 text-center text-muted">
                    لا توجد خطط دروس بعد
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Teacher schedule */}
      <section>
        <h2 className="text-lg font-medium mb-3">جدول حصص المعلمين</h2>
        <ScheduleQuickForm teachers={teachers.map((t) => ({ id: t.id, fullName: t.fullName }))} />
        <ManageRows
          columns={[
            { key: 'day', label: 'اليوم' },
            { key: 'period', label: 'الحصة' },
            { key: 'teacherName', label: 'المعلم' },
            { key: 'subject', label: 'المادة' },
            { key: 'className', label: 'الفصل' }
          ]}
          rows={schedule.map((row) => ({
            id: row.id,
            day: row.day,
            period: row.period,
            teacherId: row.teacherId,
            teacherName: row.teacher.fullName,
            subject: row.subject,
            className: row.className
          }))}
          fields={
            [
              { name: 'day', label: 'اليوم', type: 'select', required: true, options: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((d) => ({ value: d, label: d })) },
              { name: 'period', label: 'رقم الحصة', type: 'number', required: true, min: 1 },
              { name: 'teacherId', label: 'المعلم', type: 'hidden' },
              { name: 'subject', label: 'المادة', type: 'text', required: true },
              { name: 'className', label: 'الفصل', type: 'text', required: true }
            ] satisfies ManageField[]
          }
          updateAction={updateScheduleEntry}
          deleteAction={deleteScheduleEntry}
          canEdit={canManage}
          canDelete={canManage}
          emptyText="لا يوجد جدول حصص بعد"
        />
      </section>
    </div>
  );
}
