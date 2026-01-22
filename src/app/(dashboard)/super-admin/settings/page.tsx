import { auth, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { SessionUser } from "@/types";
import {
  GeneralSettingsForm,
  NotificationSettingsForm,
  SecuritySettingsForm,
  LoanSettingsForm,
  DatabaseActions,
  SystemResetAction,
} from "./settings-actions";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="הגדרות מערכת"
        description="הגדרות כלליות של המערכת"
      />

      <div className="max-w-3xl space-y-6">
        <GeneralSettingsForm />
        <NotificationSettingsForm />
        <SecuritySettingsForm />
        <LoanSettingsForm />
        <DatabaseActions />
        <SystemResetAction />
      </div>
    </div>
  );
}
