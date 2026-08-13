'use client';

import { useTransition } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { checkOutVisitor } from './actions';

export function CheckOutButton({ logId }: { logId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => checkOutVisitor(logId))}
      disabled={pending}
      className="text-xs text-brand hover:underline inline-flex items-center gap-1"
    >
      {pending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
      تسجيل خروج
    </button>
  );
}
