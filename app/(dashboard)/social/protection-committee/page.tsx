// import Link from 'next/link';
// import { prisma } from '@/lib/prisma';
// import { auth } from '@/lib/auth';
// import { redirect } from 'next/navigation';
// import { DeleteButton } from '@/components/DeleteButton';
// import { ProtectionPanel } from './ProtectionPanel';
// import { deleteSpecialistReport, deleteProtectionCommittee } from './actions';

// export const dynamic = 'force-dynamic';

// export default async function ProtectionCommitteePage() {
//   const session = await auth();
//   const permissions = ((session?.user as any)?.permissions ?? []) as string[];
//   const canView =
//     permissions.includes('specialist_report.submit') || permissions.includes('social.protection.view');
//   if (!canView) redirect('/dashboard/forbidden');

//   const canSubmit = permissions.includes('specialist_report.submit');
//   const canManage = permissions.includes('social.protection.manage');

//   const [reports, committees, students, employees] = await Promise.all([
//     prisma.specialistReport.findMany({
//       include: { student: { include: { class: true, section: true } } },
//       orderBy: { createdAt: 'desc' },
//       take: 100
//     }),
//     prisma.protectionCommittee.findMany({
//       include: {
//         student: { include: { class: true, section: true } }
//       },
//       orderBy: { createdAt: 'desc' },
//       take: 100
//     }),
//     prisma.student.findMany({
//       where: { status: 'ACTIVE' },
//       include: { class: true, section: true },
//       orderBy: { fullName: 'asc' }
//     }),
//     prisma.employee.findMany({ where: { status: 'ACTIVE' }, orderBy: { fullName: 'asc' } })
//   ]);

//   const employeeNames = new Map(employees.map((e) => [e.id, e.fullName]));

//   return (
//     <div className="space-y-8">
//       <div>
//         <Link href="/social" className="text-xs text-brand hover:underline">
//           ← الحالات الاجتماعية
//         </Link>
//         <h1 className="text-2xl font-display mt-1">لجنة الحماية المدرسية</h1>
//         <p className="text-sm text-muted">
//           المذكرات من المعلمين للأخصائيين، وتشكيل لجان الحماية والبت فيها — الأخصائي الاجتماعي (إدارة) / المديرون (اطلاع)
//         </p>
//       </div>

//       <ProtectionPanel
//         canSubmit={canSubmit}
//         canManage={canManage}
//         studentOptions={students.map((s) => ({
//           id: s.id,
//           fullName: s.fullName,
//           studentCode: s.studentCode,
//           className: [s.class?.name, s.section?.name].filter(Boolean).join(' - ') || undefined
//         }))}
//         employees={employees.map((e) => ({ id: e.id, fullName: e.fullName }))}
//         reports={reports.map((r) => ({
//           id: r.id,
//           studentName: r.student.fullName,
//           studentCode: r.student.studentCode,
//           className: [r.student.class?.name, r.student.section?.name].filter(Boolean).join(' - ') || '—',
//           content: r.content,
//           fileUrl: r.fileUrl,
//           createdAt: r.createdAt.toISOString(),
//           teacherName:
//             employeeNames.get(r.submittedByTeacherId) ??
//             employees.find((e) => e.id === r.submittedByTeacherId)?.fullName ??
//             '—'
//         }))}
//         onDeleteReport={(id) => deleteSpecialistReport(id)}
//         committees={committees.map((c) => ({
//           id: c.id,
//           studentName: c.student.fullName,
//           studentCode: c.student.studentCode,
//           className: [c.student.class?.name, c.student.section?.name].filter(Boolean).join(' - ') || '—',
//           memberNames: c.memberIds.map((mid) => employeeNames.get(mid) ?? 'موظف محذوف'),
//           status: c.status,
//           finalOpinion: c.finalOpinion,
//           createdAt: c.createdAt.toISOString()
//         }))}
//         onDeleteCommittee={(id) => deleteProtectionCommittee(id)}
//       />
//     </div>
//   );
// }

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProtectionPanel } from './ProtectionPanel';

export const dynamic = 'force-dynamic';

export default async function ProtectionCommitteePage() {
  const session = await auth();

  const permissions =
    ((session?.user as any)?.permissions ?? []) as string[];

  const canView =
    permissions.includes('specialist_report.submit') ||
    permissions.includes('social.protection.view');

  if (!canView) {
    redirect('/dashboard/forbidden');
  }

  const canSubmit = permissions.includes(
    'specialist_report.submit'
  );

  const canManage = permissions.includes(
    'social.protection.manage'
  );

  const [reports, committees, students, employees] =
    await Promise.all([
      prisma.specialistReport.findMany({
        include: {
          student: {
            include: {
              class: true,
              section: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      }),

      prisma.protectionCommittee.findMany({
        include: {
          student: {
            include: {
              class: true,
              section: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      }),

      prisma.student.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          class: true,
          section: true,
        },
        orderBy: {
          fullName: 'asc',
        },
      }),

      prisma.employee.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: {
          fullName: 'asc',
        },
      }),
    ]);

  const employeeNames = new Map(
    employees.map((employee) => [
      employee.id,
      employee.fullName,
    ])
  );

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <Link
          href="/social"
          className="text-xs text-brand hover:underline"
        >
          ← الحالات الاجتماعية
        </Link>

        <h1 className="text-2xl font-display mt-1">
          لجنة الحماية المدرسية
        </h1>

        <p className="text-sm text-muted">
          المذكرات من المعلمين للأخصائيين، وتشكيل لجان
          الحماية والبت فيها — الأخصائي الاجتماعي (إدارة) /
          المديرون (اطلاع)
        </p>
      </div>

      <ProtectionPanel
        canSubmit={canSubmit}
        canManage={canManage}
        studentOptions={students.map((student) => ({
          id: student.id,
          fullName: student.fullName,
          studentCode: student.studentCode,
          className:
            [
              student.class?.name,
              student.section?.name,
            ]
              .filter(Boolean)
              .join(' - ') || undefined,
        }))}
        employees={employees.map((employee) => ({
          id: employee.id,
          fullName: employee.fullName,
        }))}
        reports={reports.map((report) => ({
          id: report.id,
          studentName: report.student.fullName,
          studentCode: report.student.studentCode,
          className:
            [
              report.student.class?.name,
              report.student.section?.name,
            ]
              .filter(Boolean)
              .join(' - ') || '—',
          content: report.content,
          fileUrl: report.fileUrl,
          createdAt: report.createdAt.toISOString(),
          teacherName:
            employeeNames.get(
              report.submittedByTeacherId
            ) ??
            employees.find(
              (employee) =>
                employee.id ===
                report.submittedByTeacherId
            )?.fullName ??
            '—',
        }))}
        committees={committees.map((committee) => ({
          id: committee.id,
          studentName: committee.student.fullName,
          studentCode: committee.student.studentCode,
          className:
            [
              committee.student.class?.name,
              committee.student.section?.name,
            ]
              .filter(Boolean)
              .join(' - ') || '—',
          memberNames: committee.memberIds.map(
            (memberId) =>
              employeeNames.get(memberId) ??
              'موظف محذوف'
          ),
          status: committee.status,
          finalOpinion: committee.finalOpinion,
          createdAt:
            committee.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}