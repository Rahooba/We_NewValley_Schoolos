import { Suspense } from 'react';
import {
  UserCheck,
  UserX,
  Users,
  ClipboardList,
  ShieldAlert,
  Eye,
  ShoppingCart,
  UsersRound as CommitteesIcon,
  FileClock,
  BookOpenCheck
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { startOfToday, endOfToday } from '@/lib/date';
import { auth } from '@/lib/auth';
import { DashboardCard } from '@/components/DashboardCard';
import CardGridSkeleton from './CardGridSkeleton';

async function AttendanceCards() {
  const todayStart = startOfToday();
  const [activeStudents, studentPresent, activeEmployees, employeePresent] = await Promise.all([
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.studentAttendance.count({ where: { date: todayStart, status: { in: ['PRESENT', 'LATE'] } } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employeeAttendance.count({ where: { date: todayStart, status: { in: ['PRESENT', 'LATE'] } } })
  ]);
  const studentAbsentCount = Math.max(activeStudents - studentPresent, 0);
  const employeeAbsentCount = Math.max(activeEmployees - employeePresent, 0);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard
        title="حضور الطلاب اليوم"
        icon={<UserCheck size={18} className="text-brand" />}
        value={studentPresent}
        subtitle={`من ${activeStudents} طالب`}
        detailHref="/attendance/students/present"
      />
      <DashboardCard
        title="غياب الطلاب اليوم"
        icon={<UserX size={18} className="text-brand" />}
        value={studentAbsentCount}
        subtitle={`من ${activeStudents} طالب`}
        detailHref="/attendance/students/absent"
      />
      <DashboardCard
        title="حضور الموظفين اليوم"
        icon={<Users size={18} className="text-brand" />}
        value={employeePresent}
        subtitle={`من ${activeEmployees} موظف`}
        detailHref="/attendance/employees/present"
      />
      <DashboardCard
        title="غياب الموظفين اليوم"
        icon={<Users size={18} className="text-brand" />}
        value={employeeAbsentCount}
        subtitle={`من ${activeEmployees} موظف`}
        detailHref="/attendance/employees/absent"
      />
    </div>
  );
}

async function AcademicsAndQualityCards() {
  const now = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canViewLessonPlans = permissions.some((p) =>
    ['lesson_plans.overview', 'lesson_plans.manage'].includes(p)
  );

  const [lateLessonPlans, upcomingExams, qualityVisitsToday, qualityRisks] = await Promise.all([
    prisma.lessonPlan.findMany({
      where: { submittedAt: null, dueDate: { lt: now } },
      include: { subject: true, teacher: true },
      orderBy: { dueDate: 'asc' },
      take: 5
    }),
    prisma.exam.findMany({ where: { startDate: { gte: todayStart } }, orderBy: { startDate: 'asc' }, take: 5 }),
    prisma.visit.count({ where: { visitedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.risk.findMany({ take: 5 })
  ]);

  const severityTone = (s: string): 'high' | 'medium' | 'low' =>
    s === 'عالية' || s.toLowerCase() === 'high'
      ? 'high'
      : s === 'متوسطة' || s.toLowerCase() === 'medium'
        ? 'medium'
        : 'low';

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <DashboardCard
        title="خطط متأخرة"
        icon={<FileClock size={18} className="text-brand" />}
        value={lateLessonPlans.length}
        items={lateLessonPlans.map((lp) => ({
          label: lp.title,
          sub: `أ. ${lp.teacher.fullName}`
        }))}
        emptyText="لا توجد خطط متأخرة"
        detailHref={canViewLessonPlans ? '/academics/lesson-plans/overview' : undefined}
        detailLabel="تفاصيل خطط الدروس"
      />
      <DashboardCard
        title="الامتحانات القادمة"
        icon={<ClipboardList size={18} className="text-brand" />}
        value={upcomingExams.length}
        items={upcomingExams.slice(0, 3).map((ex) => ({
          label: ex.name,
          sub: new Date(ex.startDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })
        }))}
        emptyText="لا توجد امتحانات قادمة"
        detailHref="/exams"
      />
      <DashboardCard
        title="زيارات الجودة"
        icon={<Eye size={18} className="text-brand" />}
        value={qualityVisitsToday}
        subtitle="زيارات إشرافية اليوم"
        detailHref="/quality"
      />
      <DashboardCard
        title="قضايا الجودة"
        icon={<ShieldAlert size={18} className="text-brand" />}
        value={qualityRisks.length}
        items={qualityRisks.slice(0, 3).map((r) => ({
          label: r.title,
          badge: { text: r.severity, tone: severityTone(r.severity) }
        }))}
        emptyText="لا توجد قضايا جودة مسجلة"
        detailHref="/quality"
      />
    </div>
  );
}

async function OperationsCards() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [pendingPurchases, committeesCount, todaysMeetings, openRemedialFlags] = await Promise.all([
    prisma.purchaseRequest.findMany({ where: { status: 'PENDING' }, take: 5 }),
    prisma.committee.count(),
    prisma.meeting.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { committee: true },
      orderBy: { date: 'asc' }
    }),
    prisma.remedialFlag.count({ where: { status: 'open' } })
  ]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <DashboardCard
        title="طلبات الشراء"
        icon={<ShoppingCart size={18} className="text-brand" />}
        value={pendingPurchases.length}
        items={pendingPurchases.slice(0, 3).map((p) => ({
          label: p.item,
          sub: `×${p.quantity}`
        }))}
        emptyText="لا توجد طلبات شراء معلقة"
        detailHref="/inventory"
      />
      <DashboardCard
        title="اللجان"
        icon={<CommitteesIcon size={18} className="text-brand" />}
        value={committeesCount}
        items={todaysMeetings.slice(0, 3).map((m) => ({
          label: m.committee.name,
          sub: new Date(m.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }))}
        emptyText="لا توجد اجتماعات اليوم"
        detailHref="/committees"
      />
      <DashboardCard
        title="خطط علاجية مفتوحة"
        icon={<BookOpenCheck size={18} className="text-brand" />}
        value={openRemedialFlags}
        subtitle="طلاب بحاجة متابعة علاجية"
        detailHref="/exams/remedial"
      />
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">لوحة التحكم التنفيذية</h1>
        <p className="text-sm text-muted">
          ملخص الأداء والعمليات في المدرسة —{' '}
          {now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Suspense fallback={<CardGridSkeleton />}>
        <AttendanceCards />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton />}>
        <AcademicsAndQualityCards />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton />}>
        <OperationsCards />
      </Suspense>
    </div>
  );
}