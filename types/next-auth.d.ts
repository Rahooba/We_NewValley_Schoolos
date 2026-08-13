import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      roleLevel: number;
      employeeId: string | null;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    role: string;
    roleLevel: number;
    employeeId: string | null;
    permissions: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    roleLevel: number;
    employeeId: string | null;
    permissions: string[];
  }
}
