import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HQDashboard } from "./hq-dashboard";
import { DeptDashboard } from "./dept-dashboard";
import { SoldierDashboard } from "./soldier-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;

  // Route to appropriate dashboard based on role
  if (role === "super_admin" || role === "hq_commander") {
    return <HQDashboard user={session.user} />;
  }

  if (role === "dept_commander") {
    return <DeptDashboard user={session.user} />;
  }

  return <SoldierDashboard user={session.user} />;
}

