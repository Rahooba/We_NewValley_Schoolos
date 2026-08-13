import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('settings.manage')) redirect('/dashboard/forbidden');

  const rows = await prisma.setting.findMany();
  const values: Record<string, string> = {};
  for (const r of rows) values[r.key] = r.value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display mb-1">إعدادات النظام</h1>
        <p className="text-sm text-muted">الحدود والقيم المستخدمة في صفحات المعالجة والإنذارات</p>
      </div>
      <SettingsForm values={values} />
    </div>
  );
}
