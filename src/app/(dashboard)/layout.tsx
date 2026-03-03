import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { openRequests, openRequestItems, handoverDepartments, departments, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

async function getPendingOpenRequestsCount(userId: string, role: string, departmentId: string | null): Promise<number> {
  let deptIds: string[] = [];
  if (role === "super_admin" || role === "hq_commander") {
    const all = await db.query.departments.findMany({
      where: eq(departments.isActive, true),
      columns: { id: true },
    });
    deptIds = all.map((d) => d.id);
  } else if (role === "dept_commander" && departmentId) {
    deptIds = [departmentId];
  } else {
    const handover = await db.query.handoverDepartments.findMany({
      where: eq(handoverDepartments.userId, userId),
      columns: { departmentId: true },
    });
    deptIds = handover.map((h) => h.departmentId);
  }
  if (deptIds.length === 0) return 0;

  const reqs = await db.query.openRequests.findMany({
    where: inArray(openRequests.departmentId, deptIds),
    columns: { id: true },
    with: { items: { columns: { id: true, status: true } } },
  });
  return reqs.reduce((sum, r) => sum + (r.items?.filter((i) => i.status === "pending").length ?? 0), 0);
}

async function getHasOpenRequestsAccess(userId: string, role: string, departmentId: string | null): Promise<boolean> {
  if (role === "super_admin" || role === "hq_commander") return true;
  if (role === "dept_commander" && departmentId) return true;
  const handover = await db.query.handoverDepartments.findMany({
    where: eq(handoverDepartments.userId, userId),
    columns: { departmentId: true },
  });
  return handover.length > 0;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user must change password
  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  const [pendingOpenRequests, hasOpenRequestsAccess, userRow] = await Promise.all([
    getPendingOpenRequestsCount(session.user.id, session.user.role, session.user.departmentId),
    getHasOpenRequestsAccess(session.user.id, session.user.role, session.user.departmentId),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { visibleFeatures: true },
    }),
  ]);

  const visibleFeatures = (userRow?.visibleFeatures as Record<string, boolean> | null) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar
        user={session.user as SessionUser}
        pendingOpenRequests={pendingOpenRequests}
        hasOpenRequestsAccess={hasOpenRequestsAccess}
        visibleFeatures={visibleFeatures}
      />
      <main className="lg:pr-72 flex-1 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 flex-1 max-w-full overflow-x-hidden">{children}</div>
        <footer className="lg:pr-0 p-4 text-center text-sm text-slate-400 border-t border-slate-200 bg-white">
          © 2026 ipalsam. פותח על ידי יוגב אביטן
        </footer>
      </main>
    </div>
  );
}
