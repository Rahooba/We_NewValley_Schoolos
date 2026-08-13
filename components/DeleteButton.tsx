'use client';

import { useTransition, useState } from 'react';
import { Check, Loader2, Trash2, X } from 'lucide-react';

export function DeleteButton({
  onDelete,
  label = 'حذف',
  confirmText = 'متأكد من الحذف؟',
  className = ''
}: {
  onDelete: () => Promise<unknown> | void;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setConfirming(false);
    startTransition(async () => {
      await onDelete();
    });
  }

  if (confirming) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="text-xs text-red-600">{confirmText}</span>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} نعم
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-paper border border-border hover:border-ink disabled:opacity-60"
        >
          <X size={12} /> إلغاء
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={pending}
      className={`inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-sm px-2 py-1 hover:bg-red-50 disabled:opacity-60 ${className}`}
    >
      <Trash2 size={14} /> {label}
    </button>
  );
}
