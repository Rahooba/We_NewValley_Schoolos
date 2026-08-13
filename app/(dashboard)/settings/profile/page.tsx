import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileSettings } from './ProfileSettings';

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  if (!user) redirect('/login');

  return (
    <ProfileSettings
      fullName={user.fullName}
      currentEmail={user.email}
      role={user.role.name}
    />
  );
}
