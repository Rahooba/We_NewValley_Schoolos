'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, UserCircle2 } from 'lucide-react';
import { NotificationsBell } from '@/components/NotificationsBell';

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-surface px-3 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="فتح القائمة"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink transition-colors hover:bg-brand/8 hover:text-brand-dark lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <NotificationsBell />
        <Link
          href="/settings/profile"
          className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-2 pr-1 text-left transition-colors hover:bg-brand/8 sm:pl-3"
          aria-label="الملف الشخصي"
        >
          <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white">
            <UserCircle2 size={18} />
          </span>
          <div className="hidden min-w-0 text-sm sm:block">
            <p className="truncate font-medium">{session?.user?.name}</p>
            <p className="truncate text-xs text-muted">{(session?.user as any)?.role}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600 sm:px-3"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
}
