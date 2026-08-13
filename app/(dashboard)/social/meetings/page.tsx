import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { DeleteButton } from '@/components/DeleteButton';
import { MeetingForm } from './MeetingForm';
import { deleteSocialMeeting } from './actions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function SocialMeetingsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  if (!permissions.includes('social.meetings.manage')) redirect('/dashboard/forbidden');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [meetings, total] = await Promise.all([
    prisma.socialMeeting.findMany({
      orderBy: { date: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE
    }),
    prisma.socialMeeting.count()
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/social" className="text-xs text-brand hover:underline">
          ← الحالات الاجتماعية
        </Link>
        <h1 className="text-2xl font-display mt-1">الاجتماعات الشهرية</h1>
        <p className="text-sm text-muted">سجل اجتماعات الأخصائي الاجتماعي الشهرية مع النتائج — مخصص للأخصائي الاجتماعي</p>
      </div>

      <MeetingForm />

      <section>
        <h2 className="text-lg font-medium mb-3">الاجتماعات المسجلة</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-paper text-muted text-right">
              <tr>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">الحضور</th>
                <th className="px-4 py-2 font-medium">الملاحظات</th>
                <th className="px-4 py-2 font-medium">النتيجة</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    لا توجد اجتماعات مسجلة بعد
                  </td>
                </tr>
              )}
              {meetings.map((m) => (
                <tr key={m.id} className="border-t border-border align-top">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(m.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-2 text-muted">{m.attendees || '—'}</td>
                  <td className="px-4 py-2">{m.notes}</td>
                  <td className="px-4 py-2">{m.outcome}</td>
                  <td className="px-4 py-2">
                    <DeleteButton onDelete={deleteSocialMeeting.bind(null, m.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}