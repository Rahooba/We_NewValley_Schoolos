import 'dotenv/config';
import { PrismaClient, PermissionAction, Status } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter });

// Exact roles table from the original Google Sheets "Roles" tab
const roles = [
  { code: 'ROLE001', name: 'Executive Director', description: 'Full Access', level: 100 },
  { code: 'ROLE002', name: 'Academic Director', description: 'Academic Supervision', level: 90 },
  { code: 'ROLE003', name: 'HR Officer', description: 'Human Resources', level: 70 },
  { code: 'ROLE004', name: 'Student Affairs', description: 'Student Affairs', level: 70 },
  { code: 'ROLE005', name: 'Teacher', description: 'Teacher', level: 50 },
  { code: 'ROLE006', name: 'Quality Officer', description: 'Quality', level: 70 },
  { code: 'ROLE007', name: 'Reception', description: 'Reception', level: 30 },
  { code: 'ROLE008', name: 'Inventory Officer', description: 'Inventory', level: 60 },
  { code: 'ROLE009', name: 'Professional Development', description: 'Professional Development', level: 70 },
  { code: 'ROLE010', name: 'Exams Officer', description: 'Exams', level: 70 },
  { code: 'ROLE011', name: 'System Administrator', description: 'IT Admin', level: 95 },
  { code: 'ROLE012', name: 'Data Entry Officer', description: 'Daily attendance data entry', level: 40 },
  {
    code: 'ROLE013',
    name: 'Professional Transformation Officer',
    description: 'مسئول التحول الاحترافي - teaching staff with extra monitoring duties',
    level: 60
  },
  { code: 'ROLE014', name: 'Social Specialist', description: 'الأخصائي الاجتماعي', level: 50 },
  { code: 'ROLE015', name: 'Psychological Specialist', description: 'الأخصائي النفسي', level: 50 },
  { code: 'ROLE016', name: 'Security Officer', description: 'مسئول الأمن', level: 40 },
  { code: 'ROLE017', name: 'Health Visitor', description: 'زائرة صحية - متابعة العيادة', level: 40 }
];

// Exact permissions table from the original Google Sheets "Permissions" tab
const permissions = [
  { code: 'PER001', module: 'Dashboard', permissionKey: 'dashboard.view', action: 'VIEW', description: 'View Dashboard' },
  { code: 'PER002', module: 'Students', permissionKey: 'students.view', action: 'VIEW', description: 'View Students' },
  { code: 'PER003', module: 'Students', permissionKey: 'students.create', action: 'CREATE', description: 'Add Student' },
  { code: 'PER004', module: 'Students', permissionKey: 'students.edit', action: 'EDIT', description: 'Edit Student' },
  { code: 'PER005', module: 'Students', permissionKey: 'students.delete', action: 'DELETE', description: 'Delete Student' },
  { code: 'PER006', module: 'HR', permissionKey: 'hr.view', action: 'VIEW', description: 'View HR' },
  { code: 'PER007', module: 'HR', permissionKey: 'hr.create', action: 'CREATE', description: 'Add Employee' },
  { code: 'PER008', module: 'HR', permissionKey: 'hr.edit', action: 'EDIT', description: 'Edit Employee' },
  { code: 'PER009', module: 'HR', permissionKey: 'hr.delete', action: 'DELETE', description: 'Delete Employee' },
  { code: 'PER010', module: 'Academics', permissionKey: 'academics.view', action: 'VIEW', description: 'View Academics' },
  { code: 'PER011', module: 'Exams', permissionKey: 'exams.view', action: 'VIEW', description: 'View Exams' },
  { code: 'PER012', module: 'Exams', permissionKey: 'exams.manage', action: 'MANAGE', description: 'Manage Exams' },
  { code: 'PER013', module: 'Inventory', permissionKey: 'inventory.view', action: 'VIEW', description: 'View Inventory' },
  { code: 'PER014', module: 'Inventory', permissionKey: 'inventory.manage', action: 'MANAGE', description: 'Manage Inventory' },
  { code: 'PER015', module: 'Visitors', permissionKey: 'visitors.view', action: 'VIEW', description: 'View Visitors' },
  { code: 'PER016', module: 'Visitors', permissionKey: 'visitors.manage', action: 'MANAGE', description: 'Manage Visitors' },
  { code: 'PER017', module: 'Quality', permissionKey: 'quality.view', action: 'VIEW', description: 'View Quality' },
  { code: 'PER018', module: 'Quality', permissionKey: 'quality.manage', action: 'MANAGE', description: 'Manage Quality' },
  { code: 'PER019', module: 'Committees', permissionKey: 'committees.view', action: 'VIEW', description: 'View Committees' },
  { code: 'PER020', module: 'Committees', permissionKey: 'committees.manage', action: 'MANAGE', description: 'Manage Committees' },
  { code: 'PER021', module: 'Reports', permissionKey: 'reports.view', action: 'VIEW', description: 'View Reports' },
  { code: 'PER022', module: 'Reports', permissionKey: 'reports.export', action: 'EXPORT', description: 'Export Reports' },
  { code: 'PER023', module: 'Settings', permissionKey: 'settings.manage', action: 'MANAGE', description: 'System Settings' },
  { code: 'PER024', module: 'Users', permissionKey: 'users.manage', action: 'MANAGE', description: 'Manage Users' },
  { code: 'PER025', module: 'Roles', permissionKey: 'roles.manage', action: 'MANAGE', description: 'Manage Roles' },
  { code: 'PER026', module: 'Attendance', permissionKey: 'attendance.students.view', action: 'VIEW', description: 'View Student Attendance' },
  { code: 'PER027', module: 'Attendance', permissionKey: 'attendance.students.manage', action: 'MANAGE', description: 'Record Student Attendance' },
  { code: 'PER028', module: 'Attendance', permissionKey: 'attendance.employees.view', action: 'VIEW', description: 'View Employee Attendance' },
  { code: 'PER029', module: 'Attendance', permissionKey: 'attendance.employees.manage', action: 'MANAGE', description: 'Record Employee Attendance' },
  { code: 'PER030', module: 'Academics', permissionKey: 'lesson_plans.manage', action: 'MANAGE', description: 'Assign Lesson Plan Deadlines & Manage Submissions' },
  { code: 'PER031', module: 'Academics', permissionKey: 'lesson_plans.submit', action: 'CREATE', description: 'Submit Own Lesson Plan' },
  { code: 'PER033', module: 'Academics', permissionKey: 'lesson_plans.overview', action: 'VIEW', description: 'View Lesson Plans Weekly Overview Grid' },
  { code: 'PER034', module: 'Attendance', permissionKey: 'attendance.late.manage', action: 'MANAGE', description: 'Record & Track Tardiness (LATE) for Students & Employees' },
  { code: 'PER035', module: 'Students', permissionKey: 'student_behavior.view', action: 'VIEW', description: 'View Student Behavior Records' },
  { code: 'PER036', module: 'Students', permissionKey: 'student_behavior.create', action: 'CREATE', description: 'Add Student Behavior Record' },
  { code: 'PER037', module: 'Students', permissionKey: 'parents.view', action: 'VIEW', description: 'View Parents' },
  { code: 'PER038', module: 'Students', permissionKey: 'parents.contact', action: 'MANAGE', description: 'Contact Parents' },
  { code: 'PER039', module: 'Students', permissionKey: 'student_documents.view', action: 'VIEW', description: 'View Student Documents' },
  { code: 'PER040', module: 'Students', permissionKey: 'student_documents.upload', action: 'CREATE', description: 'Upload Student Documents' },
  { code: 'PER041', module: 'Students', permissionKey: 'social_cases.manage', action: 'MANAGE', description: 'Manage Social Cases' },
  { code: 'PER042', module: 'Students', permissionKey: 'student_medical.view', action: 'VIEW', description: 'View Student Medical / Psychological Records' },
  { code: 'PER043', module: 'Students', permissionKey: 'student_medical.edit', action: 'EDIT', description: 'Edit Student Medical / Psychological Records' },
  { code: 'PER044', module: 'Students', permissionKey: 'psychological_cases.manage', action: 'MANAGE', description: 'Manage Psychological Cases' },
  { code: 'PER045', module: 'HR', permissionKey: 'employee_behavior.view', action: 'VIEW', description: 'View Employee Behavior Notes' },
  { code: 'PER046', module: 'HR', permissionKey: 'employee_behavior.create', action: 'CREATE', description: 'Add Employee Behavior Note' },
  { code: 'PER047', module: 'Attendance', permissionKey: 'attendance.reports.view', action: 'VIEW', description: 'View Attendance Rate Reports' },
  { code: 'PER048', module: 'Quality', permissionKey: 'improvement_plans.view', action: 'VIEW', description: 'View Improvement Plans' },
  { code: 'PER049', module: 'Quality', permissionKey: 'improvement_plans.manage', action: 'MANAGE', description: 'Create/Edit Improvement Plans' },
  { code: 'PER050', module: 'Quality', permissionKey: 'improvement_plans.review', action: 'EDIT', description: 'Review & Close Improvement Plans' },
  { code: 'PER051', module: 'Exams', permissionKey: 'remedial.view', action: 'VIEW', description: 'View Remedial Tracking' },
  { code: 'PER052', module: 'Exams', permissionKey: 'remedial.manage', action: 'MANAGE', description: 'Manage Remedial Flags & Formative Assessments' },
  { code: 'PER053', module: 'Quality', permissionKey: 'warnings.view', action: 'VIEW', description: 'View Absence Warnings' },
  { code: 'PER054', module: 'Quality', permissionKey: 'warnings.manage', action: 'MANAGE', description: 'Issue Absence Warnings' },
  { code: 'PER055', module: 'Quality', permissionKey: 'visit_schedule.view', action: 'VIEW', description: 'View Visit Schedule' },
  { code: 'PER056', module: 'Quality', permissionKey: 'visit_schedule.manage', action: 'MANAGE', description: 'Schedule & Complete Visits' },
  { code: 'PER057', module: 'Work', permissionKey: 'work_documentation.view', action: 'VIEW', description: 'View Work Documentation' },
  { code: 'PER058', module: 'Work', permissionKey: 'work_documentation.manage', action: 'MANAGE', description: 'Add Work Documentation' },
  { code: 'PER059', module: 'Activities', permissionKey: 'activities.view', action: 'VIEW', description: 'View School Activities' },
  { code: 'PER060', module: 'Activities', permissionKey: 'activities.manage', action: 'MANAGE', description: 'Manage School Activities' },
  { code: 'PER061', module: 'Quality', permissionKey: 'broadcast.view', action: 'VIEW', description: 'View Broadcast Schedule' },
  { code: 'PER062', module: 'Quality', permissionKey: 'broadcast.manage', action: 'MANAGE', description: 'Manage Broadcast Schedule' },
  { code: 'PER063', module: 'Quality', permissionKey: 'cleanliness.view', action: 'VIEW', description: 'View Cleanliness Tracking' },
  { code: 'PER064', module: 'Quality', permissionKey: 'cleanliness.manage', action: 'MANAGE', description: 'Record Cleanliness Scores' },
  { code: 'PER065', module: 'Security', permissionKey: 'security.gate_log.view', action: 'VIEW', description: 'View Gate Presence Log' },
  { code: 'PER066', module: 'Security', permissionKey: 'security.gate_log.manage', action: 'MANAGE', description: 'Log Gate Presence Entries' },
  { code: 'PER067', module: 'Security', permissionKey: 'security.shifts.view', action: 'VIEW', description: 'View Security Shift Roster' },
  { code: 'PER068', module: 'Security', permissionKey: 'security.shifts.manage', action: 'MANAGE', description: 'Manage Security Shift Roster' },
  { code: 'PER069', module: 'Security', permissionKey: 'security.daily_summary.view', action: 'VIEW', description: 'View End-of-Day Security Summary' },
  { code: 'PER070', module: 'Security', permissionKey: 'security.daily_summary.manage', action: 'MANAGE', description: 'Submit End-of-Day Security Summary' },
  { code: 'PER071', module: 'Labs', permissionKey: 'labs.view', action: 'VIEW', description: 'View Labs Logs & Instructions' },
  { code: 'PER072', module: 'Labs', permissionKey: 'labs.manage', action: 'MANAGE', description: 'Manage Lab Open/Close Logs & Instructions' },
  { code: 'PER073', module: 'Supervision', permissionKey: 'supervision.view', action: 'VIEW', description: 'View Daily Supervision Schedule' },
  { code: 'PER074', module: 'Supervision', permissionKey: 'supervision.manage', action: 'MANAGE', description: 'Assign Daily Supervision Schedule' },
  { code: 'PER075', module: 'Workshops', permissionKey: 'workshops.view', action: 'VIEW', description: 'View Workshop Logs' },
  { code: 'PER076', module: 'Workshops', permissionKey: 'workshops.manage', action: 'MANAGE', description: 'Manage Workshop Open/Close Logs' },
  { code: 'PER077', module: 'Trainings', permissionKey: 'trainings.view', action: 'VIEW', description: 'View Internal Trainings' },
  { code: 'PER078', module: 'Trainings', permissionKey: 'trainings.manage', action: 'MANAGE', description: 'Manage Internal Trainings' },
  { code: 'PER079', module: 'Clinic', permissionKey: 'clinic.view', action: 'VIEW', description: 'View Clinic Records' },
  { code: 'PER080', module: 'Clinic', permissionKey: 'clinic.manage', action: 'MANAGE', description: 'Log Clinic Cases' },
  { code: 'PER081', module: 'Clinic', permissionKey: 'clinic.cleanliness.view', action: 'VIEW', description: 'View Clinic Cleanliness Log' },
  { code: 'PER082', module: 'Clinic', permissionKey: 'clinic.cleanliness.manage', action: 'MANAGE', description: 'Record Clinic Cleanliness Log' },
  { code: 'PER083', module: 'Social', permissionKey: 'social.meetings.manage', action: 'MANAGE', description: 'Log Monthly Social Meetings' },
  { code: 'PER084', module: 'Social', permissionKey: 'specialist_report.submit', action: 'CREATE', description: 'Submit Memo to Social/Psychological Specialist' },
  { code: 'PER085', module: 'Social', permissionKey: 'social.protection.view', action: 'VIEW', description: 'View Protection Committee Cases' },
  { code: 'PER086', module: 'Social', permissionKey: 'social.protection.manage', action: 'MANAGE', description: 'Form & Decide Protection Committees' },
  { code: 'PER087', module: 'Complaints', permissionKey: 'complaint.create', action: 'CREATE', description: 'Transcribe Complaints & Suggestions' },
  { code: 'PER088', module: 'Complaints', permissionKey: 'complaint.view', action: 'VIEW', description: 'View Complaints & Suggestions' },
  { code: 'PER089', module: 'Complaints', permissionKey: 'complaint.manage', action: 'MANAGE', description: 'Review & Update Complaint Status' },
  { code: 'PER090', module: 'Governance', permissionKey: 'governance.view', action: 'VIEW', description: 'View Governance Pages (Board, Bylaw, Notices, Contact, Groups)' },
  { code: 'PER091', module: 'Governance', permissionKey: 'notices.manage', action: 'MANAGE', description: 'Write Daily Admin Notices' },
  { code: 'PER092', module: 'Governance', permissionKey: 'board.manage', action: 'MANAGE', description: 'Manage Board Members & Board/Internal Bylaw Text' },
  { code: 'PER093', module: 'Governance', permissionKey: 'bylaw.manage', action: 'MANAGE', description: 'Edit Discipline Bylaw' },
  { code: 'PER094', module: 'Exams', permissionKey: 'enrichment.view', action: 'VIEW', description: 'View Enrichment Tracking (High Performers)' },
  { code: 'PER095', module: 'Exams', permissionKey: 'enrichment.manage', action: 'MANAGE', description: 'Manage Enrichment Flags' },
  { code: 'PER096', module: 'Transformation', permissionKey: 'violations.view', action: 'VIEW', description: 'View Student Violations' },
  { code: 'PER097', module: 'Transformation', permissionKey: 'violations.record', action: 'CREATE', description: 'Record Student Violations' },
  { code: 'PER098', module: 'Transformation', permissionKey: 'violations.act', action: 'EDIT', description: 'Take Action on Student Violations' },
  { code: 'PER099', module: 'Transformation', permissionKey: 'camps.manage', action: 'MANAGE', description: 'Manage Camps, Projects & Competitions Records' },
  { code: 'PER100', module: 'Governance', permissionKey: 'investigation_committee.manage', action: 'MANAGE', description: 'Form & Decide Internal Investigation Committees' },
  { code: 'PER101', module: 'HR', permissionKey: 'leaves.manage', action: 'MANAGE', description: 'Manage Employee Leaves (Overview Page)' }
];

// role -> permissionKey[] mapping.
// NOTE: your original "Role_Permissions" sheet only had headers with no rows yet,
// so this mapping is a reasonable default based on each role's description in your
// plan. Adjust freely in Settings > Roles once the app is running.
const sharedReadPerms = ['labs.view', 'workshops.view', 'supervision.view', 'trainings.view', 'governance.view'];

const rolePermissionMap: Record<string, string[]> = {
  ROLE001: permissions.map((p) => p.permissionKey), // Executive Director: everything
  ROLE002: [
    'dashboard.view', 'academics.view', 'students.view', 'quality.view',
    'visitors.view', 'exams.view', 'reports.view',
    'attendance.students.view', 'attendance.employees.view', 'attendance.reports.view',
    // Academic Director can view the weekly submission grid but cannot
    // create/edit lesson plans or set due dates (no lesson_plans.manage).
    'lesson_plans.overview',
    // Academic supervision: review improvement plans, view remedial & warnings,
    // and view the operations registers without full quality.manage.
    'improvement_plans.view', 'improvement_plans.review',
    'remedial.view', 'warnings.view', 'visit_schedule.view',
    'activities.view', 'broadcast.view', 'cleanliness.view', 'work_documentation.view',
    'enrichment.view', 'clinic.view', 'clinic.cleanliness.view',
     'social.protection.view', 'complaint.view', 'complaint.manage',
     'board.manage', 'notices.manage', 'violations.view',
     'investigation_committee.manage',
    // Labs / workshops / supervision / trainings (Academic Director manages).
    'labs.manage', 'workshops.manage', 'supervision.manage', ...sharedReadPerms
  ],
  ROLE003: [
    'dashboard.view', 'hr.view', 'hr.create', 'hr.edit', 'hr.delete',
    'leaves.manage',
    'attendance.employees.view', 'attendance.employees.manage', 'attendance.reports.view',
    'work_documentation.view', 'activities.view',
    // HR coordinates internal trainings.
    'trainings.manage', ...sharedReadPerms
  ],
  ROLE004: [
    'dashboard.view', 'students.view', 'students.create', 'students.edit', 'students.delete',
    'attendance.students.view', 'attendance.students.manage', 'attendance.reports.view',
    // Student Affairs issues absence warnings, tracks lateness, transcribes complaints.
    'warnings.view', 'warnings.manage', 'work_documentation.view', 'activities.view',
    'attendance.late.manage', 'complaint.create',
    ...sharedReadPerms
  ],
  ROLE005: [
    'dashboard.view', 'academics.view', 'students.view', 'lesson_plans.submit',
    // Teachers document their own work and view/execute their improvement plans.
    'work_documentation.view', 'work_documentation.manage',
    'improvement_plans.view', 'activities.view',
    // Teachers may be scheduled as daily supervisors (add points on their own day).
    // And submit memos to specialists via the protection-committee page.
    'supervision.view', 'labs.view', 'workshops.view', 'trainings.view',
    'specialist_report.submit'
  ],
  ROLE006: [
    'dashboard.view', 'quality.view', 'quality.manage', 'reports.view',
    'improvement_plans.view', 'improvement_plans.manage', 'improvement_plans.review',
    'visit_schedule.view', 'visit_schedule.manage',
    // Quality Officer views (no longer manages) absence warnings — Student Affairs owns them.
    'warnings.view',
    'cleanliness.view', 'cleanliness.manage',
    'broadcast.view', 'broadcast.manage',
    'activities.view', 'activities.manage',
    'remedial.view', 'attendance.reports.view', 'work_documentation.view',
    'enrichment.view', 'complaint.view', 'complaint.manage',
    // Quality Officer reviews the end-of-day security summary (read-only).
    'security.daily_summary.view', ...sharedReadPerms
  ],
  ROLE007: [
    'dashboard.view', 'visitors.view', 'visitors.manage',
    // Reception staffs the gate too, and transcribes complaints.
    'security.gate_log.view', 'security.gate_log.manage', 'complaint.create', ...sharedReadPerms
  ],
  ROLE008: ['dashboard.view', 'inventory.view', 'inventory.manage', ...sharedReadPerms],
  ROLE009: [
    'dashboard.view', 'students.view', 'hr.view', 'work_documentation.view', 'activities.view',
    ...sharedReadPerms
  ],
  ROLE010: [
    'dashboard.view', 'exams.view', 'exams.manage', 'reports.view',
    // Exams Officer owns remedial & enrichment tracking.
    'remedial.view', 'remedial.manage', 'enrichment.view', 'enrichment.manage',
    ...sharedReadPerms
  ],
  ROLE011: permissions.map((p) => p.permissionKey), // System Administrator: everything
  ROLE012: [
    'dashboard.view',
    'attendance.students.view', 'attendance.students.manage',
    'attendance.employees.view', 'attendance.employees.manage',
    ...sharedReadPerms
  ], // Data Entry Officer: only attendance in/out, nothing else
  ROLE013: [
    // Professional Transformation Officer = teacher + monitoring duties
    'dashboard.view', 'academics.view', 'students.view', 'lesson_plans.submit',
    'attendance.students.view', 'attendance.employees.view', 'attendance.reports.view',
    'attendance.late.manage',
    'student_behavior.view', 'student_behavior.create',
    'employee_behavior.view', 'employee_behavior.create',
    'work_documentation.view', 'work_documentation.manage',
    'activities.view', 'cleanliness.view', 'broadcast.view',
    // Section 7: read access to absence warnings (compliance tracking).
    'warnings.view',
    // Section 9: violations (records & monitors, does not resolve) + camps/projects/competitions.
    'violations.view', 'violations.record', 'camps.manage',
    // Teachers may submit memos to specialists.
    'specialist_report.submit',
    // Governance read-only (shared).
    ...sharedReadPerms
  ],
  ROLE014: [
    // Social Specialist (الأخصائي الاجتماعي)
    'dashboard.view', 'students.view',
    'student_behavior.view', 'student_behavior.create',
    'parents.view', 'parents.contact',
    'student_documents.view', 'student_documents.upload',
    'social_cases.manage',
    // Section 3: monthly meetings + protection committee (manage).
    'social.meetings.manage', 'social.protection.view', 'social.protection.manage',
    // Section 9: takes action on violations; sees student lateness.
    'violations.view', 'violations.act', 'attendance.late.manage',
    ...sharedReadPerms
  ],
  ROLE015: [
    // Psychological Specialist (الأخصائي النفسي)
    'dashboard.view', 'students.view',
    'student_medical.view', 'student_medical.edit',
    'student_behavior.view',
    'psychological_cases.manage',
    ...sharedReadPerms
  ],
  ROLE016: [
    // Security Officer (مسئول الأمن)
    'dashboard.view',
    'security.gate_log.view', 'security.gate_log.manage',
    'security.shifts.view', 'security.shifts.manage',
    'security.daily_summary.view', 'security.daily_summary.manage',
    'visitors.view', 'visitors.manage',
    ...sharedReadPerms
  ],
  ROLE017: [
    // Health Visitor (زائرة صحية) — owns the clinic.
    'dashboard.view', 'students.view', 'student_medical.view',
    'clinic.view', 'clinic.manage',
    'clinic.cleanliness.view', 'clinic.cleanliness.manage',
    ...sharedReadPerms
  ]
};

async function main() {
  console.log('Seeding roles...');
  const roleRecords = new Map<string, string>(); // code -> id
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description, level: r.level, status: Status.ACTIVE },
      create: { ...r, status: Status.ACTIVE }
    });
    roleRecords.set(r.code, role.id);
  }

  console.log('Seeding permissions...');
  const permRecords = new Map<string, string>(); // key -> id
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        module: p.module,
        permissionKey: p.permissionKey,
        action: p.action as PermissionAction,
        description: p.description,
        status: Status.ACTIVE
      },
      create: {
        code: p.code,
        module: p.module,
        permissionKey: p.permissionKey,
        action: p.action as PermissionAction,
        description: p.description,
        status: Status.ACTIVE
      }
    });
    permRecords.set(p.permissionKey, perm.id);
  }

  console.log('Linking role permissions...');
  for (const [roleCode, keys] of Object.entries(rolePermissionMap)) {
    const roleId = roleRecords.get(roleCode)!;

    // Remove stale links that are no longer granted to this role
    // (e.g. the old lessonplans.manage link on ROLE002)
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permission: { permissionKey: { notIn: keys } }
      }
    });

    for (const key of keys) {
      const permissionId = permRecords.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId }
      });
    }
  }

  // =========================================================
  // Classes & Sections — 6 فصول فعلية بالمدرسة
  // الصف الأول: A1, A2 (عام) | الصف الثاني: B1, B2 | الصف الثالث: C1, C2
  // =========================================================
  console.log('Seeding classes & sections...');
  const classDefs = [
    { name: 'الصف الأول', level: 1, sections: ['A1', 'A2'] },
    { name: 'الصف الثاني', level: 2, sections: ['B1', 'B2'] },
    { name: 'الصف الثالث', level: 3, sections: ['C1', 'C2'] }
  ];
  const sectionRecords = new Map<string, string>(); // section name -> id

  for (const c of classDefs) {
    const existingClass = await prisma.class.findFirst({ where: { name: c.name } });
    const classRow =
      existingClass ?? (await prisma.class.create({ data: { name: c.name, level: c.level } }));
    if (existingClass) {
      await prisma.class.update({ where: { id: classRow.id }, data: { level: c.level } });
    }

    for (const sName of c.sections) {
      const existingSection = await prisma.section.findFirst({
        where: { name: sName, classId: classRow.id }
      });
      const sectionRow =
        existingSection ??
        (await prisma.section.create({ data: { name: sName, classId: classRow.id } }));
      sectionRecords.set(sName, sectionRow.id);
    }
  }

  // =========================================================
  // Subjects — التخصصات الأساسية (سنة تانية وتالتة) + مواد عامة
  // =========================================================
  console.log('Seeding subjects...');
  const subjectDefs = [
    { code: 'SUB-PRG', name: 'برمجة' },
    { code: 'SUB-NET', name: 'شبكات' },
    { code: 'SUB-COM', name: 'اتصالات' },
    { code: 'SUB-ELE', name: 'كهرباء' },
    { code: 'SUB-PHY', name: 'فيزياء' },
    { code: 'SUB-ENG', name: 'لغة إنجليزية' },
    { code: 'SUB-SOC', name: 'دراسات وتربية وطنية' },
    { code: 'SUB-ARA', name: 'لغة عربية ودين' }
  ];
  const subjectRecords = new Map<string, string>(); // code -> id
  for (const s of subjectDefs) {
    const row = await prisma.subject.upsert({
      where: { code: s.code },
      update: { name: s.name },
      create: { code: s.code, name: s.name }
    });
    subjectRecords.set(s.code, row.id);
  }

  // =========================================================
  // Employees + their system users (real staff من خطة المدرسة)
  // كل موظف بتاريخ عقد ومرتب افتراضي، وحساب دخول لمن له دور بالنظام
  // =========================================================
  console.log('Seeding employees & user accounts...');

  type StaffDef = {
    fullName: string;
    position: string;
    department: string;
    roleCode: string; // key into `roles` above
    email: string;
    isAdminSeed?: boolean; // uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
  };

  const staff: StaffDef[] = [
    {
      fullName: 'مصطفى ناصف أنيس',
      position: 'المدير التنفيذي',
      department: 'الإدارة العليا',
      roleCode: 'ROLE001',
      email: process.env.SEED_ADMIN_EMAIL ?? 'mostafa.nassef@schoolos.local',
      isAdminSeed: true
    },
    {
      fullName: 'أيمن حمدون',
      position: 'المدير الأكاديمي',
      department: 'الإدارة الأكاديمية',
      roleCode: 'ROLE002',
      email: 'ayman.hamdoun@schoolos.local'
    },
    {
      fullName: 'رحاب أشرف',
      position: 'مهندس برمجة - مسئول نظم (System Admin)',
      department: 'تكنولوجيا المعلومات',
      roleCode: 'ROLE011',
      email: 'rehab.ashraf@schoolos.local'
    },
    {
      fullName: 'منى مصطفى',
      position: 'مهندس اتصالات - معلم',
      department: 'قسم الاتصالات',
      roleCode: 'ROLE005',
      email: 'mona.mostafa@schoolos.local'
    },
    {
      fullName: 'شيماء علي',
      position: 'مهندس اتصالات - معلم',
      department: 'قسم الاتصالات',
      roleCode: 'ROLE005',
      email: 'shaimaa.ali@schoolos.local'
    },
    {
      fullName: 'هبة',
      position: 'مهندس كهرباء - معلم',
      department: 'قسم الكهرباء',
      roleCode: 'ROLE005',
      email: 'heba.electrical@schoolos.local'
    },
    {
      fullName: 'عبدالرحمن ضاحي',
      position: 'مهندس شبكات - معلم',
      department: 'قسم الشبكات',
      roleCode: 'ROLE005',
      email: 'abdelrahman.dahy@schoolos.local'
    },
    {
      fullName: 'عصمت حمدي',
      position: 'مسئول التحول الاحترافي',
      department: 'التحول الاحترافي',
      roleCode: 'ROLE013',
      email: 'esmat.hamdy@schoolos.local'
    },
    {
      fullName: 'حسن',
      position: 'أخصائي اجتماعي',
      department: 'شئون الطلاب',
      roleCode: 'ROLE014',
      email: 'hassan.social@schoolos.local'
    },
    {
      fullName: 'أخصائي نفسي',
      position: 'أخصائي نفسي',
      department: 'شئون الطلاب',
      roleCode: 'ROLE015',
      email: 'psychologist@schoolos.local'
    },
    {
      fullName: 'فاطمة',
      position: 'مسئول شئون الطلبة',
      department: 'شئون الطلاب',
      roleCode: 'ROLE004',
      email: 'fatma.studentaffairs@schoolos.local'
    },
    {
      fullName: 'فاطمة',
      position: 'مسئول شئون العاملين',
      department: 'الموارد البشرية',
      roleCode: 'ROLE003',
      email: 'fatma.hr@schoolos.local'
    },
    {
      fullName: 'إيناس علي',
      position: 'معلم فيزياء',
      department: 'قسم العلوم',
      roleCode: 'ROLE005',
      email: 'enas.ali@schoolos.local'
    },
    {
      fullName: 'أسماء سنوسي',
      position: 'معلم لغة إنجليزية',
      department: 'قسم اللغات',
      roleCode: 'ROLE005',
      email: 'asmaa.sonossy@schoolos.local'
    },
    {
      fullName: 'مصطفى جويد',
      position: 'معلم دراسات وتربية وطنية',
      department: 'قسم المواد الاجتماعية',
      roleCode: 'ROLE005',
      email: 'mostafa.gowaid@schoolos.local'
    },
    {
      fullName: 'محمود خلف',
      position: 'معلم لغة عربية ودين',
      department: 'قسم اللغة العربية',
      roleCode: 'ROLE005',
      email: 'mahmoud.khalaf@schoolos.local'
    },
    {
      fullName: 'محمد فطوم',
      position: 'مسئول تقييم وامتحانات',
      department: 'الامتحانات',
      roleCode: 'ROLE010',
      email: 'mohamed.fotom@schoolos.local'
    },
    {
      fullName: 'محمود أبو شوشة',
      position: 'مسئول جودة',
      department: 'الجودة',
      roleCode: 'ROLE006',
      email: 'mahmoud.aboshosha@schoolos.local'
    },
    {
      fullName: 'مسئول إدخال البيانات',
      position: 'موظف إدخال بيانات - الحضور والغياب',
      department: 'الإدارة',
      roleCode: 'ROLE012',
      email: 'data.entry@schoolos.local'
    },
    {
      fullName: 'مسئول الأمن',
      position: 'مسئول أمن',
      department: 'الأمن',
      roleCode: 'ROLE016',
      email: 'security@schoolos.local'
    },
    {
      fullName: 'زائرة صحية',
      position: 'زائرة صحية - متابعة العيادة',
      department: 'العيادة المدرسية',
      roleCode: 'ROLE017',
      email: 'clinic@schoolos.local'
    }
  ];

  const employeeRecords = new Map<string, string>(); // email -> employeeId

  // Key employees on the existing user's employeeId (email is the stable identity),
  // so inserting staff mid-list never shifts EMP-### codes and breaks uniqueness.
  const existingEmployees = await prisma.employee.findMany({ select: { employeeCode: true } });
  let maxEmpSeq = existingEmployees.reduce((max, e) => {
    const n = parseInt(e.employeeCode.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);

  for (const s of staff) {
    const existingUser = await prisma.user.findUnique({ where: { email: s.email } });

    let employeeId = existingUser?.employeeId ?? null;
    if (!employeeId) {
      maxEmpSeq += 1;
      const employeeCode = `EMP-${String(maxEmpSeq).padStart(3, '0')}`;
      const employee = await prisma.employee.create({
        data: {
          employeeCode,
          fullName: s.fullName,
          position: s.position,
          department: s.department,
          status: Status.ACTIVE,
          contracts: {
            create: [
              {
                startDate: new Date('2025-09-01'),
                salary: 8000,
                type: 'دوام كامل'
              }
            ]
          }
        }
      });
      employeeId = employee.id;
    } else {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          fullName: s.fullName,
          position: s.position,
          department: s.department,
          status: Status.ACTIVE
        }
      });
    }
    employeeRecords.set(s.email, employeeId);

    const password = s.isAdminSeed
      ? process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'
      : 'Welcome@2026';
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        fullName: s.fullName,
        roleId: roleRecords.get(s.roleCode)!,
        employeeId,
        status: Status.ACTIVE
      },
      create: {
        fullName: s.fullName,
        email: s.email,
        passwordHash,
        roleId: roleRecords.get(s.roleCode)!,
        employeeId,
        status: Status.ACTIVE
      }
    });
  }

  // =========================================================
  // Teacher schedule — ربط سريع بين معلمي التخصصات الأساسية والفصول
  // (سنة تانية وتالتة فقط، لأن السنة الأولى عامة بدون تخصص)
  // =========================================================
  console.log('Seeding a starter teacher schedule...');
  const scheduleSeed: { email: string; subjectCode: string; day: string; period: number; className: string }[] = [
    { email: 'mona.mostafa@schoolos.local', subjectCode: 'SUB-COM', day: 'الأحد', period: 1, className: 'B1' },
    { email: 'shaimaa.ali@schoolos.local', subjectCode: 'SUB-COM', day: 'الأحد', period: 1, className: 'C1' },
    { email: 'abdelrahman.dahy@schoolos.local', subjectCode: 'SUB-NET', day: 'الاثنين', period: 2, className: 'B2' },
    { email: 'heba.electrical@schoolos.local', subjectCode: 'SUB-ELE', day: 'الثلاثاء', period: 3, className: 'C2' },
    { email: 'enas.ali@schoolos.local', subjectCode: 'SUB-PHY', day: 'الأحد', period: 2, className: 'A1' },
    { email: 'asmaa.sonossy@schoolos.local', subjectCode: 'SUB-ENG', day: 'الاثنين', period: 1, className: 'A2' },
    { email: 'mostafa.gowaid@schoolos.local', subjectCode: 'SUB-SOC', day: 'الثلاثاء', period: 1, className: 'A1' },
    { email: 'mahmoud.khalaf@schoolos.local', subjectCode: 'SUB-ARA', day: 'الأربعاء', period: 1, className: 'A2' }
  ];

  for (const row of scheduleSeed) {
    const teacherId = employeeRecords.get(row.email);
    if (!teacherId) continue;
    const subjectName = subjectDefs.find((s) => s.code === row.subjectCode)?.name ?? row.subjectCode;
    const existing = await prisma.teacherSchedule.findFirst({
      where: { teacherId, day: row.day, period: row.period }
    });
    if (!existing) {
      await prisma.teacherSchedule.create({
        data: {
          teacherId,
          day: row.day,
          period: row.period,
          subject: subjectName,
          className: row.className
        }
      });
    }
  }

  // =========================================================
  // System settings — thresholds used by remedial & warnings pages
  // =========================================================
  console.log('Seeding settings...');
  const settingsDefaults: Record<string, string> = {
    // Corrected threshold (Batch 3): below 65% triggers a remedial flag.
    remedial_threshold_percent: '65',
    enrichment_threshold_percent: '90',
    absence_warning_threshold_days: '3',
    absence_warning_break_days: '5'
  };
  for (const [key, value] of Object.entries(settingsDefaults)) {
    await prisma.setting.upsert({
      where: { key },
      // Apply the corrected default to already-seeded keys (idempotent re-runs).
      update: { value },
      create: { key, value }
    });
  }

  console.log('Done seeding.');
  console.log('---');
  console.log('حسابات الدخول (البريد / كلمة المرور):');
  for (const s of staff) {
    const password = s.isAdminSeed ? process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!' : 'Welcome@2026';
    console.log(`  ${s.fullName.padEnd(20, ' ')} | ${s.email.padEnd(34, ' ')} | ${password}`);
  }
  console.log('---');
  console.log('⚠️  غيّر كل كلمات المرور فور أول تسجيل دخول فعلي بالمدرسة.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
