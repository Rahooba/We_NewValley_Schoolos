import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DisciplineBylawForm } from './DisciplineBylawForm';

export const dynamic = 'force-dynamic';

export default async function DisciplineBylawPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('governance.view')) redirect('/dashboard/forbidden');

  const canManage = permissions.includes('bylaw.manage');

  const bylaw = await prisma.schoolBylaw.findFirst({ where: { section: 'discipline_bylaw' } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display mb-1">لائحة الانضباط المدرسي</h1>
        <p className="text-sm text-muted">نص اللائحة الثابت — المدير التنفيذي (تعديل) / الجميع (اطلاع)</p>
      </div>

      <DisciplineBylawForm
        section="discipline_bylaw"
        defaultTitle={bylaw?.title ?? 'لائحة الانضباط المدرسي'}
        defaultContent={bylaw?.content ?? ''}
        canManage={canManage}
      />

      {bylaw && (
        <div className="card p-6 prose prose-ar max-w-none">
          <p className="text-sm text-muted mb-2">معاينة المحتوى:</p>
          <div dangerouslySetInnerHTML={{ __html: bylaw.content.replace(/\n/g, '<br />') }} />
        </div>
      )}
    </div>
  );
}