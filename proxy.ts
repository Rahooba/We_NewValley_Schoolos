import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { findRequiredPermission } from '@/lib/nav';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredPermission = findRequiredPermission(pathname);
  if (requiredPermission) {
    const permissions = (token.permissions as string[]) ?? [];
    const allowed = Array.isArray(requiredPermission)
      ? requiredPermission.some((p) => permissions.includes(p))
      : permissions.includes(requiredPermission);
    if (!allowed) {
      return NextResponse.redirect(new URL('/dashboard/forbidden', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/attendance/:path*',
    '/students/:path*',
    '/hr/:path*',
    '/academics/:path*',
    '/exams/:path*',
    '/inventory/:path*',
    '/visitors/:path*',
    '/quality/:path*',
    '/committees/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/social/:path*',
    '/psychological/:path*',
    '/professional-transformation/:path*',
    '/security/:path*',
    '/labs/:path*',
    '/workshops/:path*',
    '/supervision/:path*',
    '/trainings/:path*',
    '/clinic/:path*',
    '/complaints/:path*',
    '/governance/:path*',
    '/discipline-bylaw/:path*',
    '/contact/:path*'
  ]
};
