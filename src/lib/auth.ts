import NextAuth, { type DefaultSession, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionUser } from "@/types";

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }
  interface User {
    phone: string;
    firstName: string;
    lastName: string;
    role: "super_admin" | "hq_commander" | "dept_commander" | "soldier";
    departmentId: string | null;
    baseId: string | null;
    mustChangePassword: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        phone: { label: "טלפון", type: "text" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        const phone = credentials.phone as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.phone, phone),
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        // Update last login
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          baseId: user.baseId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.email = user.email;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.baseId = user.baseId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          phone: token.phone as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          email: (token.email as string) || null,
          role: token.role as SessionUser["role"],
          departmentId: (token.departmentId as string) || null,
          baseId: (token.baseId as string) || null,
          mustChangePassword: token.mustChangePassword as boolean,
        },
      };
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
});

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

// Permission helpers
export function canAccessSuperAdmin(
  role: SessionUser["role"] | undefined
): boolean {
  return role === "super_admin" || role === "hq_commander";
}

export function isSuperAdmin(role: SessionUser["role"] | undefined): boolean {
  return role === "super_admin";
}

export function isDeptCommander(role: SessionUser["role"] | undefined): boolean {
  return role === "dept_commander";
}

export function canManageDepartment(
  userRole: SessionUser["role"],
  userDepartmentId: string | null,
  targetDepartmentId: string
): boolean {
  if (userRole === "super_admin" || userRole === "hq_commander") {
    return true;
  }
  if (userRole === "dept_commander" && userDepartmentId === targetDepartmentId) {
    return true;
  }
  return false;
}

