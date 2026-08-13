import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CommitteeForm, MemberForm, MeetingForm } from './QuickForms';
import { CommitteeCard } from './CommitteeCard';

export default async function CommitteesPage() {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const canManage = permissions.includes('committees.manage');

  const committees = await prisma.committee.findMany({
    include: {
      members: true,
      meetings: { orderBy: { date: 'desc' }, take: 5, include: { tasks: true } }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display">اللجان</h1>

      <section>
        <h2 className="text-lg font-medium mb-3">إنشاء لجنة</h2>
        <CommitteeForm />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">إضافة عضو</h2>
        <MemberForm committees={committees.map((c) => ({ id: c.id, name: c.name }))} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">جدولة اجتماع</h2>
        <MeetingForm committees={committees.map((c) => ({ id: c.id, name: c.name }))} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {committees.map((c) => (
          <CommitteeCard key={c.id} committee={c} canManage={canManage} />
        ))}
        {committees.length === 0 && (
          <p className="text-muted text-sm col-span-full">لا توجد لجان بعد</p>
        )}
      </section>
    </div>
  );
}
