import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { weeksRange } from '@/lib/weeks';
import { LessonPlansOverview } from './LessonPlansOverview';

export const dynamic = 'force-dynamic';

export default async function LessonPlansOverviewPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('lesson_plans.manage');

  const weeks = weeksRange(-4, 2);
  const weekFrom = new Date(`${weeks[0].mondayISO}T00:00:00`);
  const weekTo = new Date(`${weeks[weeks.length - 1].mondayISO}T00:00:00`);
  weekTo.setDate(weekTo.getDate() + 7);

  const [teachers, subjects, plans, schedules] = await Promise.all([
    prisma.employee.findMany({ where: { status: 'ACTIVE' }, orderBy: { fullName: 'asc' } }),
    prisma.subject.findMany({ orderBy: { name: 'asc' } }),
    prisma.lessonPlan.findMany({
      where: { weekOf: { gte: weekFrom, lt: weekTo } },
      include: { subject: true, teacher: true },
      orderBy: { weekOf: 'asc' }
    }),
    prisma.teacherSchedule.findMany({ select: { teacherId: true, className: true } })
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">تفاصيل خطط الدروس</h1>
        <p className="text-sm text-muted">
          شبكة المتابعة الأسبوعية لخطط الدروس — {canManage ? 'إدارة كاملة' : 'عرض فقط (بدون صلاحية تعديل)'}
        </p>
      </div>

      <LessonPlansOverview
        canManage={canManage}
        teachers={teachers.map((t) => ({ id: t.id, fullName: t.fullName }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        schedules={schedules.map((s) => ({ teacherId: s.teacherId, className: s.className }))}
        plans={plans.map((p) => ({
          id: p.id,
          teacherId: p.teacherId,
          subjectId: p.subjectId,
          subjectName: p.subject.name,
          title: p.title,
          weekNumber: p.weekNumber,
          weekOf: p.weekOf.toISOString(),
          dueDate: p.dueDate.toISOString(),
          submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
          fileUrl: p.fileUrl,
          fileHref: p.fileUrl ? `/api/lesson-plans/file?planId=${p.id}` : null
        }))}
      />
    </div>
  );
}
