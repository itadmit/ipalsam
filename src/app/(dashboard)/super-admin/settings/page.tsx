import { auth, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { SessionUser } from "@/types";
import {
  getGeneralSettings,
  getNotificationSettings,
  getSecuritySettings,
  getLoanSettings,
} from "@/actions/settings";
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

  const [general, notifications, security, loan] = await Promise.all([
    getGeneralSettings(),
    getNotificationSettings(),
    getSecuritySettings(),
    getLoanSettings(),
  ]);

  return (
    <div>
      <PageHeader
        title="הגדרות מערכת"
        description="הגדרות כלליות של המערכת"
      />

      <div className="max-w-3xl space-y-6">
        <GeneralSettingsForm
          initialBaseName={!("error" in general) ? general.baseName : "בסיס מרכזי"}
          initialSystemEmail={!("error" in general) ? general.systemEmail : "system@ipalsam.co.il"}
        />
        <NotificationSettingsForm
          initialOverdue={!("error" in notifications) ? notifications.overdueNotifications : true}
          initialLowStock={!("error" in notifications) ? notifications.lowStockNotifications : true}
          initialNewRequest={!("error" in notifications) ? notifications.newRequestNotifications : true}
        />
        <SecuritySettingsForm
          initialSessionTimeout={!("error" in security) ? security.sessionTimeout : "24"}
          initialForcePasswordChange={!("error" in security) ? security.forcePasswordChange : true}
        />
        <LoanSettingsForm
          initialDefaultLoanDays={!("error" in loan) ? loan.defaultLoanDays : "7"}
          initialOverdueDays={!("error" in loan) ? loan.overdueDays : "1"}
        />
        <DatabaseActions />
        <SystemResetAction />
      </div>
    </div>
  );
}
