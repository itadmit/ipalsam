import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import type { SessionUser } from "@/types";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar user={session.user as SessionUser} />
      <main className="lg:pr-72 flex-1 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 flex-1">{children}</div>
        <footer className="lg:pr-0 p-4 text-center text-sm text-slate-400 border-t border-slate-200 bg-white">
          © 2026 ipalsam. פותח על ידי יוגב אביטן
        </footer>
      </main>
    </div>
  );
}
