// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useSession } from 'next-auth/react';
// import {
//   LayoutDashboard,
//   GraduationCap,
//   Users,
//   BookOpen,
//   ClipboardList,
//   Boxes,
//   DoorOpen,
//   ShieldCheck,
//   UsersRound,
//   FileBarChart,
//   Settings,
//   UserCheck,
//   HeartHandshake,
//   Brain,
//   UserCog,
//   BookOpenCheck,
//   AlertTriangle,
//   CalendarCheck,
//   FileText,
//   Activity,
//   Megaphone,
//   Sparkles,
//   ShieldAlert,
//   FlaskConical,
//   ClipboardCheck,
//   Hammer,
//   Presentation,
//   Cross,
//   Medal,
//   Handshake,
//   Shield,
//   MessageSquare,
//   Building2,
//   ScrollText,
//   Contact,
//   Tent,
//   Lightbulb,
//   Trophy
// } from 'lucide-react';
// import { X } from 'lucide-react';
// import { NAV_GROUPS, NAV_ITEMS, type NavItem } from '@/lib/nav';

// const ICONS: Record<NavItem['icon'], React.ElementType> = {
//   dashboard: LayoutDashboard,
//   attendance: UserCheck,
//   students: GraduationCap,
//   hr: Users,
//   academics: BookOpen,
//   exams: ClipboardList,
//   inventory: Boxes,
//   visitors: DoorOpen,
//   quality: ShieldCheck,
//   committees: UsersRound,
//   reports: FileBarChart,
//   settings: Settings,
//   social: HeartHandshake,
//   psychological: Brain,
//   professional: UserCog,
//   remedial: BookOpenCheck,
//   warnings: AlertTriangle,
//   schedule: CalendarCheck,
//   documentation: FileText,
//   activities: Activity,
//   broadcast: Megaphone,
//   cleanliness: Sparkles,
//   security: ShieldAlert,
//   labs: FlaskConical,
//   supervision: ClipboardCheck,
//   workshops: Hammer,
//   trainings: Presentation,
//   clinic: Cross,
//   sports: Medal,
//   meetings: Handshake,
//   protection: Shield,
//   complaints: MessageSquare,
//   governance: Building2,
//   notices: Megaphone,
//   bylaw: ScrollText,
//   contact: Contact,
//   violations: AlertTriangle,
//   camps: Tent,
//   projects: Lightbulb,
//   competitions: Trophy
// };

// function itemAllowed(item: NavItem, permissions: string[]): boolean {
//   const required = Array.isArray(item.permission) ? item.permission : [item.permission];
//   return required.some((p) => permissions.includes(p));
// }

// type SidebarProps = {
//   open?: boolean;
//   onClose?: () => void;
// };

// export function Sidebar({ open = false, onClose }: SidebarProps) {
//   const { data: session } = useSession();
//   const pathname = usePathname();
//   const permissions = (session?.user as any)?.permissions ?? [];

//   return (
//     <aside
//       className={`fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-72 shrink-0 flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
//         open ? 'translate-x-0' : 'translate-x-full'
//       }`}
//     >
//       <div className="flex items-center gap-3 border-b border-border px-5 py-5">
//         <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.55)]">
//           <span className="font-display text-base font-extrabold">OS</span>
//         </span>
//         <div className="min-w-0 flex-1">
//           <p className="font-display text-lg font-extrabold leading-none text-brand-dark">SchoolOS</p>
//           <p className="mt-1 text-xs text-muted">نظام إدارة المدرسة</p>
//         </div>
//         <button
//           type="button"
//           onClick={onClose}
//           aria-label="إغلاق القائمة"
//           className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand/8 hover:text-brand-dark lg:hidden"
//         >
//           <X size={20} />
//         </button>
//       </div>
//       <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
//         {NAV_GROUPS.map((group) => {
//           const items = NAV_ITEMS.filter((item) => item.group === group && itemAllowed(item, permissions));
//           if (items.length === 0) return null;
//           return (
//             <div key={group}>
//               <p className="px-3 pb-1 text-[11px] font-semibold text-muted">{group}</p>
//               <div className="space-y-1">
//                 {items.map((item) => {
//                   const Icon = ICONS[item.icon];
//                   const active = pathname.startsWith(item.href);
//                   return (
//                     <Link
//                       key={item.href}
//                       href={item.href}
//                       onClick={onClose}
//                       className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
//                         active
//                           ? 'brand-gradient text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.5)]'
//                           : 'text-ink hover:bg-brand/8 hover:text-brand-dark'
//                       }`}
//                     >
//                       <Icon size={18} />
//                       {item.labelAr}
//                     </Link>
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         })}
//       </nav>
//     </aside>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  Boxes,
  DoorOpen,
  ShieldCheck,
  UsersRound,
  FileBarChart,
  Settings,
  UserCheck,
  HeartHandshake,
  Brain,
  UserCog,
  BookOpenCheck,
  AlertTriangle,
  CalendarCheck,
  FileText,
  Activity,
  Megaphone,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  ClipboardCheck,
  Hammer,
  Presentation,
  Cross,
  Medal,
  Handshake,
  Shield,
  MessageSquare,
  Building2,
  ScrollText,
  Contact,
  Tent,
  Lightbulb,
  Trophy
} from 'lucide-react';
import { X, ChevronDown } from 'lucide-react';
import { NAV_GROUPS, NAV_ITEMS, type NavItem } from '@/lib/nav';

const ICONS: Record<NavItem['icon'], React.ElementType> = {
  dashboard: LayoutDashboard,
  attendance: UserCheck,
  students: GraduationCap,
  hr: Users,
  academics: BookOpen,
  exams: ClipboardList,
  inventory: Boxes,
  visitors: DoorOpen,
  quality: ShieldCheck,
  committees: UsersRound,
  reports: FileBarChart,
  settings: Settings,
  social: HeartHandshake,
  psychological: Brain,
  professional: UserCog,
  remedial: BookOpenCheck,
  warnings: AlertTriangle,
  schedule: CalendarCheck,
  documentation: FileText,
  activities: Activity,
  broadcast: Megaphone,
  cleanliness: Sparkles,
  security: ShieldAlert,
  labs: FlaskConical,
  supervision: ClipboardCheck,
  workshops: Hammer,
  trainings: Presentation,
  clinic: Cross,
  sports: Medal,
  meetings: Handshake,
  protection: Shield,
  complaints: MessageSquare,
  governance: Building2,
  notices: Megaphone,
  bylaw: ScrollText,
  contact: Contact,
  violations: AlertTriangle,
  camps: Tent,
  projects: Lightbulb,
  competitions: Trophy
};

function itemAllowed(item: NavItem, permissions: string[]): boolean {
  const required = Array.isArray(item.permission) ? item.permission : [item.permission];
  return required.some((p) => permissions.includes(p));
}

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const permissions = (session?.user as any)?.permissions ?? [];

  // كل مجموعة (شئون الطلاب، شئون العاملين...) بتتفتح/تتقفل لوحدها كـ accordion.
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // أول ما الصفحة تتغيّر، افتحي أوتوماتيك المجموعة اللي فيها الصفحة الحالية.
  useEffect(() => {
    const activeGroup = NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.group;
    if (activeGroup) {
      setOpenGroups((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
    }
  }, [pathname]);

  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-72 shrink-0 flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.55)]">
          <span className="font-display text-base font-extrabold">OS</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold leading-none text-brand-dark">SchoolOS</p>
          <p className="mt-1 text-xs text-muted">نظام إدارة المدرسة</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand/8 hover:text-brand-dark lg:hidden"
        >
          <X size={20} />
        </button>
      </div>
      {/* الرئيسيه دروب داون  */}
      {/* <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group && itemAllowed(item, permissions));
          if (items.length === 0) return null;

          const isOpen = openGroups.has(group);
          const hasActiveItem = items.some((item) => pathname.startsWith(item.href));

          return (
            <div key={group} className="overflow-hidden rounded-xl">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                aria-expanded={isOpen}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  hasActiveItem ? 'text-brand-dark' : 'text-muted hover:bg-brand/8 hover:text-brand-dark'
                }`}
              >
                <span>{group}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 space-y-1 overflow-hidden px-1 pb-1 pt-0.5">
                  {items.map((item) => {
                    const Icon = ICONS[item.icon];
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          active
                            ? 'brand-gradient text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.5)]'
                            : 'text-ink hover:bg-brand/8 hover:text-brand-dark'
                        }`}
                      >
                        <Icon size={18} />
                        {item.labelAr}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav> */}

      
 <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5">

  {/* =========================
      الرئيسية - ثابتة بدون Dropdown
  ========================= */}
  {(() => {
    const dashboardItem = NAV_ITEMS.find(
      (item) => item.icon === 'dashboard'
    );

    if (!dashboardItem || !itemAllowed(dashboardItem, permissions)) {
      return null;
    }

    const active =
      pathname === dashboardItem.href ||
      (dashboardItem.href !== '/' && pathname.startsWith(dashboardItem.href));

    const Icon = ICONS[dashboardItem.icon];

    return (
      <Link
        href={dashboardItem.href}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? 'brand-gradient text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.5)]'
            : 'text-ink hover:bg-brand/8 hover:text-brand-dark'
        }`}
      >
        <Icon size={18} />
        {dashboardItem.labelAr}
      </Link>
    );
  })()}

  {/* =========================
      باقي المجموعات - Dropdown
  ========================= */}
  {NAV_GROUPS.map((group) => {
    const items = NAV_ITEMS.filter(
      (item) =>
        item.group === group &&
        item.icon !== 'dashboard' &&
        itemAllowed(item, permissions)
    );

    if (items.length === 0) return null;

    const isOpen = openGroups.has(group);

    const hasActiveItem = items.some(
      (item) => pathname.startsWith(item.href)
    );

    return (
      <div key={group} className="overflow-hidden rounded-xl">

        {/* Group Header */}
        <button
          type="button"
          onClick={() => toggleGroup(group)}
          aria-expanded={isOpen}
          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${
            hasActiveItem
              ? 'text-brand-dark'
              : 'text-muted hover:bg-brand/8 hover:text-brand-dark'
          }`}
        >
          <span>{group}</span>

          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Group Items */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 space-y-1 overflow-hidden px-1 pb-1 pt-0.5">

            {items.map((item) => {
              const Icon = ICONS[item.icon];

              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'brand-gradient text-white shadow-[0_8px_16px_-6px_rgba(91,42,140,0.5)]'
                      : 'text-ink hover:bg-brand/8 hover:text-brand-dark'
                  }`}
                >
                  <Icon size={18} />
                  {item.labelAr}
                </Link>
              );
            })}

          </div>
        </div>
      </div>
    );
  })}
</nav>
    </aside>
  );
}