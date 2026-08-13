import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Roles that always have every permission (Executive Director & System Administrator).
// They are granted the full permission list dynamically on login, so any permission
// added later (even without re-seeding) is immediately available to them.
const SUPERUSER_ROLE_CODES = ['ROLE001', 'ROLE011'];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  },
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '');
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: { include: { permissions: { include: { permission: true } } } } }
        });

        if (!user || user.status !== 'ACTIVE') return null;

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return null;

        await prisma.loginLog.create({
          data: { userId: user.id, success: true }
        });
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        let permissions = user.role.permissions.map((rp) => rp.permission.permissionKey);
        if (SUPERUSER_ROLE_CODES.includes(user.role.code)) {
          const allActive = await prisma.permission.findMany({ where: { status: 'ACTIVE' } });
          permissions = Array.from(new Set([...permissions, ...allActive.map((p) => p.permissionKey)]));
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role.name,
          roleLevel: user.role.level,
          employeeId: user.employeeId ?? null,
          permissions
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.roleLevel = (user as any).roleLevel;
        token.employeeId = (user as any).employeeId;
        token.permissions = (user as any).permissions;
      }
      if (trigger === 'update' && (session as any)?.email) {
        token.email = (session as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).roleLevel = token.roleLevel;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    }
  }
});
