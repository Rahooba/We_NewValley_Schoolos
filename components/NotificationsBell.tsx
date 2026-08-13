'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // silent — best effort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id })
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' })
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative text-muted hover:text-ink"
        aria-label="الإشعارات"
        onClick={() => {
          setOpen(!open);
          if (unreadCount > 0) markAllRead();
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-border rounded-sm shadow-lg z-50">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">الإشعارات</span>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand hover:underline"
                aria-label="تحديد الكل كمقروء"
              >
                <Check size={14} />
              </button>
            )}
          </div>
          {loading && notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-muted">جارٍ التحميل...</div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-muted">لا توجد إشعارات</div>
          )}
          <div className="py-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b border-border cursor-pointer hover:bg-paper ${
                  !n.isRead ? 'bg-paper' : ''
                }`}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted mt-1 line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(n.createdAt).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
