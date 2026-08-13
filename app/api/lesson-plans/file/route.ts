import { NextResponse, type NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function safeFilename(title: string): string {
  return title.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/_+/g, '_').slice(0, 60) || 'lesson-plan';
}

function rfc5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function asciiFallback(value: string): string {
  const ascii = value.replace(/[^\x20-\x7E]/g, '_').replace(/["\\()]/g, '_');
  return (ascii || 'lesson-plan') + '.pdf';
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];
  const employeeId = (session?.user as any)?.employeeId as string | null | undefined;

  const planId = request.nextUrl.searchParams.get('planId');
  if (!planId) return new NextResponse('Missing planId', { status: 400 });

  const plan = await prisma.lessonPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.fileUrl) return new NextResponse('Not found', { status: 404 });

  const canManage = permissions.includes('lesson_plans.manage');
  const canView = permissions.includes('lesson_plans.overview');
  const isOwn = permissions.includes('lesson_plans.submit') && !!employeeId && plan.teacherId === employeeId;
  if (!canManage && !canView && !isOwn) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const result = await get(plan.fileUrl, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return new NextResponse('Not found', { status: 404 });
    }
    const name = safeFilename(plan.title);
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/pdf',
        'Content-Disposition': `inline; filename="${asciiFallback(name)}"; filename*=UTF-8''${rfc5987(name)}.pdf`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache'
      }
    });
  } catch (err) {
    console.error('lesson-plan file stream failed', err);
    return new NextResponse('Not found', { status: 404 });
  }
}
