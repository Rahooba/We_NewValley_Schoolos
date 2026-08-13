import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function startOfDay(d: Date, daysFromNow: number): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() + daysFromNow);
  return r;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStart = startOfDay(new Date(), 0);
  const tomorrowStart = startOfDay(new Date(), 1);
  const dayAfterTomorrow = startOfDay(new Date(), 2);
  const threeDays = startOfDay(new Date(), 3);

  let broadcastNotified = 0;
  let visitNotified = 0;

  // 1) Broadcast reminders — day before the scheduled broadcast
  const broadcasts = await prisma.broadcastSchedule.findMany({
    where: {
      notified: false,
      employeeId: { not: null },
      broadcastDate: { gte: tomorrowStart, lt: dayAfterTomorrow }
    },
    include: { employee: { include: { user: true } } }
  });

  for (const b of broadcasts) {
    const user = b.employee?.user;
    if (!user) continue;
    const claimed = await prisma.broadcastSchedule.updateMany({
      where: { id: b.id, notified: false },
      data: { notified: true }
    });
    if (claimed.count === 0) continue;
    const theme = b.theme ?? '';
    const cls = b.className ?? '';
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'إذاعة مدرسية غدًا',
        message: `غدًا موعد الإذاعة المدرسية${theme ? ` بموضوع «${theme}»` : ''}${cls ? ` (الفصل: ${cls})` : ''}.`
      }
    });
    broadcastNotified++;
  }

  // 2) Visit reminders — scheduled visits within the next 3 days
  const visits = await prisma.visit.findMany({
    where: {
      status: 'scheduled',
      employeeId: { not: null },
      remindedAt: null,
      plannedVisitDate: { gte: todayStart, lt: threeDays }
    },
    include: { employee: { include: { user: true } } }
  });

  for (const v of visits) {
    const user = v.employee?.user;
    if (!user) continue;
    const claimed = await prisma.visit.updateMany({
      where: { id: v.id, remindedAt: null },
      data: { remindedAt: new Date() }
    });
    if (claimed.count === 0) continue;
    const when = v.plannedVisitDate
      ? v.plannedVisitDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'قريبًا';
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'زيارة إشرافية قادمة',
        message: `تم تحديد زيارة إشرافية لك في ${when}${v.purpose ? ` (الغرض: ${v.purpose})` : ''}.`
      }
    });
    visitNotified++;
  }

  return NextResponse.json({ ok: true, broadcastNotified, visitNotified });
}
