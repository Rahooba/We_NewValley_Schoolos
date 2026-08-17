export type NavItem = {
  label: string;
  labelAr: string;
  href: string;
  group: string; // Arabic group header in the sidebar
  icon:
    | 'dashboard'
    | 'students'
    | 'hr'
    | 'academics'
    | 'exams'
    | 'inventory'
    | 'visitors'
    | 'quality'
    | 'committees'
    | 'reports'
    | 'settings'
    | 'attendance'
    | 'social'
    | 'psychological'
    | 'professional'
    | 'warnings'
    | 'schedule'
    | 'documentation'
    | 'activities'
    | 'broadcast'
    | 'cleanliness'
    | 'security'
    | 'labs'
    | 'supervision'
    | 'workshops'
    | 'trainings'
    | 'clinic'
    | 'sports'
    | 'meetings'
    | 'protection'
    | 'complaints'
    | 'governance'
    | 'notices'
    | 'bylaw'
    | 'contact'
    | 'violations'
    | 'camps'
    | 'projects'
    | 'competitions';
  permission: string | string[]; // permissionKey(s) required to see/access this item
};

export const NAV_GROUPS = [
  'الرئيسية',
  'شئون الطلاب',
  'شئون العاملين',
  'العملية التعليمية',
  'الجودة',
  'المتابعة والتوثيق',
  'التقارير',
  'الموارد',
  'الخدمات الاجتماعية والنفسية',
  'التحول الاحترافي',
  'الأمن والمرافق',
  'الحوكمة والتواصل',
  'الإعدادات'
];

export const NAV_ITEMS: NavItem[] = [
  // ===== الرئيسية =====
  { label: 'Dashboard', labelAr: 'الرئيسية', href: '/dashboard', group: 'الرئيسية', icon: 'dashboard', permission: 'dashboard.view' },

  // ===== شئون الطلاب =====
  { label: 'Students', labelAr: 'شئون الطلاب', href: '/students', group: 'شئون الطلاب', icon: 'students', permission: 'students.view' },
  {
    label: 'Student Attendance',
    labelAr: 'حضور وغياب الطلاب',
    href: '/attendance/students',
    group: 'شئون الطلاب',
    icon: 'attendance',
    permission: 'attendance.students.view'
  },
  {
    label: 'Attendance Reports',
    labelAr: 'تقارير الحضور والغياب',
    href: '/attendance/reports',
    group: 'شئون الطلاب',
    icon: 'reports',
    permission: 'attendance.reports.view'
  },
  {
    label: 'Absence Warnings',
    labelAr: 'إنذارات الغياب',
    href: '/quality/warnings',
    group: 'شئون الطلاب',
    icon: 'warnings',
    permission: 'warnings.view'
  },

  // ===== شئون العاملين =====
  { label: 'HR', labelAr: 'شئون العاملين', href: '/hr', group: 'شئون العاملين', icon: 'hr', permission: 'hr.view' },
  {
    label: 'Leaves',
    labelAr: 'الإجازات',
    href: '/hr/leaves',
    group: 'شئون العاملين',
    icon: 'hr',
    permission: 'hr.view'
  },
  {
    label: 'Employee Attendance',
    labelAr: 'حضور وغياب الموظفين',
    href: '/attendance/employees',
    group: 'شئون العاملين',
    icon: 'attendance',
    permission: 'attendance.employees.view'
  },

  // ===== العملية التعليمية =====
  { label: 'Academics', labelAr: 'العملية التعليمية', href: '/academics', group: 'العملية التعليمية', icon: 'academics', permission: 'academics.view' },
  { label: 'Exams', labelAr: 'الامتحانات', href: '/exams', group: 'العملية التعليمية', icon: 'exams', permission: 'exams.view' },
  {
    label: 'Supervision Schedule',
    labelAr: 'جدول الإشراف اليومي',
    href: '/supervision',
    group: 'العملية التعليمية',
    icon: 'supervision',
    permission: 'supervision.view'
  },

  // ===== الجودة =====
  { label: 'Quality', labelAr: 'الجودة', href: '/quality', group: 'الجودة', icon: 'quality', permission: 'quality.view' },
  {
    label: 'Improvement Plans',
    labelAr: 'خطط التحسين',
    href: '/quality/improvement-plans',
    group: 'الجودة',
    icon: 'quality',
    permission: 'improvement_plans.view'
  },
  {
    label: 'Visit Schedule',
    labelAr: 'جدول الزيارات',
    href: '/quality/visits/schedule',
    group: 'الجودة',
    icon: 'schedule',
    permission: 'visit_schedule.view'
  },
  {
    label: 'Broadcast Schedule',
    labelAr: 'الإذاعة المدرسية',
    href: '/quality/broadcast',
    group: 'الجودة',
    icon: 'broadcast',
    permission: 'broadcast.view'
  },
  {
    label: 'Cleanliness',
    labelAr: 'متابعة النظافة',
    href: '/quality/cleanliness',
    group: 'الجودة',
    icon: 'cleanliness',
    permission: 'cleanliness.view'
  },
  {
    label: 'Trainings',
    labelAr: 'التدريبات الداخلية',
    href: '/trainings',
    group: 'الجودة',
    icon: 'trainings',
    permission: 'trainings.view'
  },

  // ===== المتابعة والتوثيق =====
  {
    label: 'Work Documentation',
    labelAr: 'توثيق الأعمال',
    href: '/documentation',
    group: 'المتابعة والتوثيق',
    icon: 'documentation',
    permission: 'work_documentation.view'
  },
  {
    label: 'Activities',
    labelAr: 'الأنشطة المدرسية',
    href: '/activities',
    group: 'المتابعة والتوثيق',
    icon: 'activities',
    permission: 'activities.view'
  },
  {
    label: 'Sports Activities',
    labelAr: 'الأنشطة الرياضية',
    href: '/activities/sports',
    group: 'المتابعة والتوثيق',
    icon: 'sports',
    permission: 'activities.view'
  },
  { label: 'Committees', labelAr: 'اللجان', href: '/committees', group: 'المتابعة والتوثيق', icon: 'committees', permission: 'committees.view' },

  // ===== التقارير =====
  { label: 'Reports', labelAr: 'التقارير', href: '/reports', group: 'التقارير', icon: 'reports', permission: 'reports.view' },
  {
    label: 'Daily Summary',
    labelAr: 'ملخص نهاية اليوم',
    href: '/reports/daily-summary',
    group: 'التقارير',
    icon: 'reports',
    permission: 'reports.view'
  },

  // ===== الموارد =====
  { label: 'Inventory', labelAr: 'المخازن', href: '/inventory', group: 'الموارد', icon: 'inventory', permission: 'inventory.view' },
  { label: 'Visitors', labelAr: 'الزوار', href: '/visitors', group: 'الموارد', icon: 'visitors', permission: 'visitors.view' },

  // ===== الخدمات الاجتماعية والنفسية =====
  {
    label: 'Social Cases',
    labelAr: 'الحالات الاجتماعية',
    href: '/social',
    group: 'الخدمات الاجتماعية والنفسية',
    icon: 'social',
    permission: 'social_cases.manage'
  },
  {
    label: 'Social Meetings',
    labelAr: 'الاجتماعات الشهرية',
    href: '/social/meetings',
    group: 'الخدمات الاجتماعية والنفسية',
    icon: 'meetings',
    permission: 'social.meetings.manage'
  },
  {
    label: 'Protection Committee',
    labelAr: 'لجنة الحماية المدرسية',
    href: '/social/protection-committee',
    group: 'الخدمات الاجتماعية والنفسية',
    icon: 'protection',
    permission: ['specialist_report.submit', 'social.protection.view']
  },
  {
    label: 'Psychological Cases',
    labelAr: 'الحالات النفسية',
    href: '/psychological',
    group: 'الخدمات الاجتماعية والنفسية',
    icon: 'psychological',
    permission: 'psychological_cases.manage'
  },

  // ===== التحول الاحترافي =====
  {
    label: 'Professional Transformation',
    labelAr: 'التحول الاحترافي',
    href: '/professional-transformation',
    group: 'التحول الاحترافي',
    icon: 'professional',
    permission: 'attendance.late.manage'
  },
  {
    label: 'Student Violations',
    labelAr: 'مخالفات الطلاب',
    href: '/professional-transformation/violations',
    group: 'التحول الاحترافي',
    icon: 'violations',
    permission: 'violations.view'
  },
  {
    label: 'Camps',
    labelAr: 'المعسكرات',
    href: '/professional-transformation/camps',
    group: 'التحول الاحترافي',
    icon: 'camps',
    permission: 'camps.manage'
  },
  {
    label: 'Student Projects',
    labelAr: 'المشروعات الطلابية',
    href: '/professional-transformation/projects',
    group: 'التحول الاحترافي',
    icon: 'projects',
    permission: 'camps.manage'
  },
  {
    label: 'Competitions & Honors',
    labelAr: 'مسابقات وتكريمات',
    href: '/professional-transformation/competitions',
    group: 'التحول الاحترافي',
    icon: 'competitions',
    permission: 'camps.manage'
  },

  // ===== الأمن والمرافق =====
  {
    label: 'Gate Presence Log',
    labelAr: 'سجل الحضور بالبوابة',
    href: '/security/gate-log',
    group: 'الأمن والمرافق',
    icon: 'security',
    permission: 'security.gate_log.view'
  },
  {
    label: 'Security Shifts',
    labelAr: 'ورديات الأمن',
    href: '/security/shifts',
    group: 'الأمن والمرافق',
    icon: 'security',
    permission: 'security.shifts.view'
  },
  {
    label: 'End-of-Day Summary',
    labelAr: 'ملخص نهاية اليوم الأمني',
    href: '/security/daily-summary',
    group: 'الأمن والمرافق',
    icon: 'security',
    permission: 'security.daily_summary.view'
  },
  {
    label: 'Labs Logs',
    labelAr: 'سجل المعامل',
    href: '/labs',
    group: 'الأمن والمرافق',
    icon: 'labs',
    permission: 'labs.view'
  },
  {
    label: 'Workshop Logs',
    labelAr: 'سجل الورش',
    href: '/workshops',
    group: 'الأمن والمرافق',
    icon: 'workshops',
    permission: 'workshops.view'
  },
  {
    label: 'Clinic',
    labelAr: 'العيادة المدرسية',
    href: '/clinic',
    group: 'الأمن والمرافق',
    icon: 'clinic',
    permission: 'clinic.view'
  },

  // ===== الحوكمة والتواصل =====
  {
    label: 'School Board',
    labelAr: 'مجلس إدارة المدرسة',
    href: '/governance/board',
    group: 'الحوكمة والتواصل',
    icon: 'governance',
    permission: 'governance.view'
  },
  {
    label: 'Admin Notices',
    labelAr: 'الأوامر الإدارية',
    href: '/governance/notices',
    group: 'الحوكمة والتواصل',
    icon: 'notices',
    permission: 'governance.view'
  },
  {
    label: 'Discipline Bylaw',
    labelAr: 'لائحة الانضباط المدرسي',
    href: '/discipline-bylaw',
    group: 'الحوكمة والتواصل',
    icon: 'bylaw',
    permission: 'governance.view'
  },
  {
    label: 'Contact Groups',
    labelAr: 'جروبات المدرسة',
    href: '/contact',
    group: 'الحوكمة والتواصل',
    icon: 'contact',
    permission: 'governance.view'
  },
  {
    label: 'Complaints',
    labelAr: 'صندوق الشكاوى والمقترحات',
    href: '/complaints',
    group: 'الحوكمة والتواصل',
    icon: 'complaints',
    permission: ['complaint.create', 'complaint.view']
  },
  {
    label: 'Investigation Committee',
    labelAr: 'لجنة الاستجوابات الداخلية',
    href: '/governance/investigations',
    group: 'الحوكمة والتواصل',
    icon: 'governance',
    permission: 'investigation_committee.manage'
  },

  // ===== الإعدادات =====
  { label: 'Users', labelAr: 'إدارة المستخدمين', href: '/settings/users', group: 'الإعدادات', icon: 'settings', permission: 'users.manage' },
  { label: 'Roles', labelAr: 'الأدوار والصلاحيات', href: '/settings/roles', group: 'الإعدادات', icon: 'settings', permission: 'roles.manage' },
  {
    label: 'System Settings',
    labelAr: 'إعدادات النظام',
    href: '/settings',
    group: 'الإعدادات',
    icon: 'settings',
    permission: 'settings.manage'
  }
];

// Route prefix -> permission required. Used by middleware.ts to guard every request.
export const ROUTE_PERMISSIONS: { prefix: string; permission: string | string[] }[] = [
  { prefix: '/dashboard', permission: 'dashboard.view' },
  { prefix: '/attendance/students', permission: 'attendance.students.view' },
  { prefix: '/attendance/employees', permission: 'attendance.employees.view' },
  { prefix: '/attendance/reports', permission: 'attendance.reports.view' },
  { prefix: '/students', permission: 'students.view' },
  { prefix: '/hr/leaves', permission: 'hr.view' },
  { prefix: '/hr', permission: 'hr.view' },
  {
    prefix: '/academics/lesson-plans/overview',
    permission: ['lesson_plans.overview', 'lesson_plans.manage']
  },
  { prefix: '/academics/files', permission: 'lesson_plans.manage' },
  { prefix: '/academics', permission: 'academics.view' },
  { prefix: '/exams', permission: 'exams.view' },
  { prefix: '/inventory', permission: 'inventory.view' },
  { prefix: '/visitors', permission: 'visitors.view' },
  { prefix: '/quality/improvement-plans', permission: 'improvement_plans.view' },
  { prefix: '/quality/visits/schedule', permission: 'visit_schedule.view' },
  { prefix: '/quality/warnings', permission: 'warnings.view' },
  { prefix: '/quality/broadcast', permission: 'broadcast.view' },
  { prefix: '/quality/cleanliness', permission: 'cleanliness.view' },
  { prefix: '/quality', permission: 'quality.view' },
  { prefix: '/committees', permission: 'committees.view' },
  { prefix: '/reports', permission: 'reports.view' },
  { prefix: '/social/meetings', permission: 'social.meetings.manage' },
  { prefix: '/social/protection-committee', permission: ['specialist_report.submit', 'social.protection.view'] },
  { prefix: '/social', permission: 'social_cases.manage' },
  { prefix: '/psychological', permission: 'psychological_cases.manage' },
  { prefix: '/professional-transformation/violations', permission: 'violations.view' },
  { prefix: '/professional-transformation/camps', permission: 'camps.manage' },
  { prefix: '/professional-transformation/projects', permission: 'camps.manage' },
  { prefix: '/professional-transformation/competitions', permission: 'camps.manage' },
  { prefix: '/professional-transformation', permission: 'attendance.late.manage' },
  { prefix: '/security/gate-log', permission: 'security.gate_log.view' },
  { prefix: '/security/shifts', permission: 'security.shifts.view' },
  { prefix: '/security/daily-summary', permission: 'security.daily_summary.view' },
  { prefix: '/clinic', permission: 'clinic.view' },
  { prefix: '/labs', permission: 'labs.view' },
  { prefix: '/workshops', permission: 'workshops.view' },
  { prefix: '/supervision', permission: 'supervision.view' },
  { prefix: '/trainings', permission: 'trainings.view' },
  { prefix: '/documentation', permission: 'work_documentation.view' },
  { prefix: '/activities/sports', permission: 'activities.view' },
  { prefix: '/activities', permission: 'activities.view' },
  { prefix: '/complaints', permission: ['complaint.create', 'complaint.view'] },
  { prefix: '/governance/investigations', permission: 'investigation_committee.manage' },
  { prefix: '/governance', permission: 'governance.view' },
  { prefix: '/discipline-bylaw', permission: 'governance.view' },
  { prefix: '/contact', permission: 'governance.view' },
  { prefix: '/settings/users', permission: 'users.manage' },
  { prefix: '/settings/roles', permission: 'roles.manage' },
  { prefix: '/settings', permission: 'settings.manage' }
];

export function findRequiredPermission(pathname: string): string | string[] | null {
  const match = ROUTE_PERMISSIONS.filter((r) => pathname.startsWith(r.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length
  )[0];
  return match ? match.permission : null;
}