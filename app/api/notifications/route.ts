import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === 'markAllRead') {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true }
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'markRead' && body?.id) {
    await prisma.notification.update({
      where: { id: body.id, userId: session.user.id },
      data: { isRead: true }
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Bad request' }, { status: 400 });
}
