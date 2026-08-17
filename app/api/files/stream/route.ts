// import { NextResponse, type NextRequest } from 'next/server';
// import { get } from '@vercel/blob';
// import { auth } from '@/lib/auth';

// export const dynamic = 'force-dynamic';

// function rfc5987(value: string): string {
//   return encodeURIComponent(value).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
// }

// function asciiFallback(value: string): string {
//   return value.replace(/[^\x20-\x7E]/g, '_').replace(/["\\()]/g, '_') || 'file';
// }

// export async function GET(request: NextRequest) {
//   const session = await auth();
//   const permissions = ((session?.user as any)?.permissions ?? []) as string[];
//   if (!session || !permissions.includes('lesson_plans.manage')) {
//     return new NextResponse('Forbidden', { status: 403 });
//   }

//   const pathname = request.nextUrl.searchParams.get('pathname');
//   if (!pathname) return new NextResponse('Missing pathname', { status: 400 });
//   const download = request.nextUrl.searchParams.get('download') === '1';

//   try {
//     const result = await get(pathname, { access: 'private' });
//     if (!result || result.statusCode !== 200) {
//       return new NextResponse('Not found', { status: 404 });
//     }
//     const name = pathname.split('/').pop() ?? 'file';
//     return new NextResponse(result.stream, {
//       headers: {
//         'Content-Type': result.blob.contentType || 'application/octet-stream',
//         'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${asciiFallback(name)}"; filename*=UTF-8''${rfc5987(name)}`,
//         'X-Content-Type-Options': 'nosniff',
//         'Cache-Control': 'private, no-cache'
//       }
//     });
//   } catch (err) {
//     console.error('file stream failed', err);
//     return new NextResponse('Not found', { status: 404 });
//   }
// }
// -----------------------------------------------------------------------------------
import { NextResponse, type NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function rfc5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function asciiFallback(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '_').replace(/["\\()]/g, '_') || 'file';
}

// Map each blob path prefix to the permission required to view it.
// Add an entry here whenever a new section starts storing private files
// through this shared route.
const PATHNAME_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: 'activities/', permission: 'camps.manage' },
  { prefix: 'lesson-plans/', permission: 'lesson_plans.manage' },
  { prefix: 'supervision/', permission: 'supervision.view' }
];

export async function GET(request: NextRequest) {
  const session = await auth();
  const permissions = ((session?.user as any)?.permissions ?? []) as string[];

  const pathname = request.nextUrl.searchParams.get('pathname');
  if (!pathname) return new NextResponse('Missing pathname', { status: 400 });
  const download = request.nextUrl.searchParams.get('download') === '1';

  const rule = PATHNAME_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  const requiredPermission = rule?.permission ?? 'lesson_plans.manage';
  if (!session || !permissions.includes(requiredPermission)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return new NextResponse('Not found', { status: 404 });
    }
    const name = pathname.split('/').pop() ?? 'file';
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${asciiFallback(name)}"; filename*=UTF-8''${rfc5987(name)}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache'
      }
    });
  } catch (err) {
    console.error('file stream failed', err);
    return new NextResponse('Not found', { status: 404 });
  }
}

