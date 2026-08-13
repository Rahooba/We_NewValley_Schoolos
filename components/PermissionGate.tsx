'use client';

import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

export function PermissionGate({
  permission,
  children
}: {
  permission: string;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const permissions = (session?.user as any)?.permissions ?? [];

  if (!permissions.includes(permission)) return null;
  return <>{children}</>;
}
