// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';
// import { DailySummaryPanel } from './DailySummaryPanel';

// export const dynamic = 'force-dynamic';

// export default async function DailySummaryPage({
//   searchParams
// }: {
//   searchParams: Promise<{ date?: string }>;
// }) {
//   const session = await auth();
//   const permissions = ((session?.user as any)?.permissions ?? []) as string[];
//   if (!permissions.includes('reports.view')) redirect('/dashboard/forbidden');

//   const { date } = await searchParams;
//   const selectedDate = date ? new Date(`${date}T00:00:00`) : new Date();

//   const start = new Date(selectedDate);
//   start.setHours(0, 0, 0, 0);
//   const end = new Date(start.getTime() + 86400000);

//   const [students, employees, exams, visits, securitySummary, gateLogs, warnings, qualityIssues, complaints, notices, studentAttendance, employeeAttendance] =
//     await Promise.all([
//       prisma.student.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.employee.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
//       prisma.exam.findMany({ where: { startDate: { gte: start, lt: end } } }),
//       prisma.visit.findMany({ where: { plannedVisitDate: { gte: start, lt: end } } }),
//       prisma.securityDailySummary.findMany({ where: { date: { gte: start, lt: end } } }),
//       prisma.gateLog.findMany({ where: { timestamp: { gte: start, lt: end } } }),
//       prisma.warningLog.findMany({ where: { warningDate: { gte: start, lt: end } } }),
//       prisma.improvementPlan.findMany({ where: { dueDate: { gte: start, lt: end } } }),
//       prisma.complaint.findMany({ where: { createdAt: { gte: start, lt: end } } }),
//       prisma.adminNotice.findMany({ where: { date: { gte: start, lt: end } } }),
//       prisma.studentAttendance.groupBy({ by: ['status'], where: { date: { gte: start, lt: end } }, _count: { status: true } }),
//       prisma.employeeAttendance.groupBy({ by: ['status'], where: { date: { gte: start, lt: end } }, _count: { status: true } })
//     ]);

//   const studentPresent = studentAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const studentRate = students.length > 0 ? ((studentPresent / students.length) * 100).toFixed(1) : '0';

//   const employeePresent = employeeAttendance.find((a) => a.status === 'PRESENT')?._count.status ?? 0;
//   const employeeRate = employees.length > 0 ? ((employeePresent / employees.length) * 100).toFixed(1) : '0';

//   // Transform data for panel
//   const panelExams = exams.map((e) => ({
//     id: e.id,
//     name: e.name,
//     startDate: e.startDate.toISOString(),
//     endDate: e.endDate.toISOString()
//   }));

//   const panelVisits = visits.map((v) => ({
//     id: v.id,
//     type: v.purpose ?? 'زيارة',
//     entity: v.visitor,
//     status: v.status
//   }));

//   const panelSecuritySummary = securitySummary.map((s) => ({
//     id: s.id,
//     content: s.summary
//   }));

//   const panelGateLogs = gateLogs.map((g) => ({ id: g.id }));

//   const panelWarnings = warnings.map((w) => ({
//     id: w.id,
//     studentId: w.studentId,
//     type: w.reason
//   }));

//   const panelQualityIssues = qualityIssues.map((q) => ({
//     id: q.id,
//     title: q.title,
//     status: q.status
//   }));

//   const panelComplaints = complaints.map((c) => ({
//     id: c.id,
//     type: c.type,
//     fromType: c.fromType,
//     status: c.status
//   }));

//   const panelNotices = notices.map((n) => ({
//     id: n.id,
//     content: n.content
//   }));

//   return (
//     <div>
//       <div className="mb-6">
//         <h1 className="text-2xl font-display mb-1">ملخص نهاية اليوم</h1>
//         <p className="text-sm text-muted">تقرير مجمع عن حضور، امتحانات، زيارات، أمن، جودة، شكاوى وأوامر إدارية</p>
//       </div>

//       <DailySummaryPanel
//         selectedDate={selectedDate.toISOString().slice(0, 10)}
//         studentRate={studentRate}
//         employeeRate={employeeRate}
//         exams={panelExams}
//         visits={panelVisits}
//         securitySummary={panelSecuritySummary}
//         gateLogs={panelGateLogs}
//         warnings={panelWarnings}
//         qualityIssues={panelQualityIssues}
//         complaints={panelComplaints}
//         notices={panelNotices}
//       />
//     </div>
//   );
// }
// ظبطنا لتايم زون ولحدالابديت دا احنا زي الفل 
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DailySummaryPanel } from './DailySummaryPanel';

export const dynamic = 'force-dynamic';

export default async function DailySummaryPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  if (!permissions.includes('reports.view')) {
    redirect('/dashboard/forbidden');
  }

  const { date } = await searchParams;

  const selectedDate = date
    ? new Date(`${date}T00:00:00`)
    : new Date();

  const start = new Date(selectedDate);

  start.setHours(0, 0, 0, 0);

  const end = new Date(start.getTime() + 86400000);

  const [
    students,
    employees,
    exams,
    visits,
    securitySummary,
    gateLogs,
    warnings,
    qualityIssues,
    complaints,
    notices,
    studentAttendance,
    employeeAttendance
  ] = await Promise.all([
    prisma.student.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    }),

    prisma.employee.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    }),

    prisma.exam.findMany({
      where: {
        startDate: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.visit.findMany({
      where: {
        plannedVisitDate: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.securityDailySummary.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.gateLog.findMany({
      where: {
        timestamp: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.warningLog.findMany({
      where: {
        warningDate: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.improvementPlan.findMany({
      where: {
        dueDate: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.adminNotice.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      }
    }),

    prisma.studentAttendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      _count: {
        status: true
      }
    }),

    prisma.employeeAttendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      _count: {
        status: true
      }
    })
  ]);

  // =========================
  // Attendance
  // =========================

  const studentPresent =
    studentAttendance.find(
      (a) => a.status === 'PRESENT'
    )?._count.status ?? 0;

  const studentRate =
    students.length > 0
      ? ((studentPresent / students.length) * 100).toFixed(1)
      : '0';

  const employeePresent =
    employeeAttendance.find(
      (a) => a.status === 'PRESENT'
    )?._count.status ?? 0;

  const employeeRate =
    employees.length > 0
      ? ((employeePresent / employees.length) * 100).toFixed(1)
      : '0';

  // =========================
  // Transform data
  // =========================

  const panelExams = exams.map((e) => ({
    id: e.id,
    name: e.name,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString()
  }));

  const panelVisits = visits.map((v) => ({
    id: v.id,
    type: v.purpose ?? 'زيارة',
    entity: v.visitor,
    status: v.status
  }));

  const panelSecuritySummary = securitySummary.map((s) => ({
    id: s.id,
    content: s.summary
  }));

  const panelGateLogs = gateLogs.map((g) => ({
    id: g.id
  }));

  const panelWarnings = warnings.map((w) => ({
    id: w.id,
    studentId: w.studentId,
    type: w.reason
  }));

  const panelQualityIssues = qualityIssues.map((q) => ({
    id: q.id,
    title: q.title,
    status: q.status
  }));

  const panelComplaints = complaints.map((c) => ({
    id: c.id,
    type: c.type,
    fromType: c.fromType,
    status: c.status
  }));

  const panelNotices = notices.map((n) => ({
    id: n.id,
    content: n.content
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display mb-1">
          ملخص نهاية اليوم
        </h1>

        <p className="text-sm text-muted">
          تقرير مجمع عن حضور، امتحانات، زيارات، أمن،
          جودة، شكاوى وأوامر إدارية
        </p>
      </div>

      <DailySummaryPanel
        selectedDate={selectedDate.toISOString().slice(0, 10)}
        studentRate={studentRate}
        employeeRate={employeeRate}
        exams={panelExams}
        visits={panelVisits}
        securitySummary={panelSecuritySummary}
        gateLogs={panelGateLogs}
        warnings={panelWarnings}
        qualityIssues={panelQualityIssues}
        complaints={panelComplaints}
        notices={panelNotices}
      />
    </div>
  );
}