import { Suspense } from "react";
import Link from "next/link";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Package,
  FileText,
  Settings,
  Shield,
  Database,
  History,
  AlertTriangle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { departments, users, itemTypes, requests, auditLogs } from "@/db/schema";
import { eq, count, desc, or } from "drizzle-orm";

async function AdminStats() {
  const [deptCount] = await db
    .select({ count: count() })
    .from(departments)
    .where(eq(departments.isActive, true));
  const [userCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true));
  const [itemCount] = await db.select({ count: count() }).from(itemTypes);
  const [activeLoansCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(eq(requests.status, "handed_over"));
  const [pendingCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(or(eq(requests.status, "submitted"), eq(requests.status, "approved")));
  const pendingRequests = pendingCount?.count || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="מחלקות"
        value={deptCount?.count || 0}
        icon={Building2}
        description="פעילות"
      />
      <StatCard
        title="משתמשים"
        value={userCount?.count || 0}
        icon={Users}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="פריטי ציוד"
        value={(itemCount?.count || 0).toLocaleString()}
        icon={Package}
        iconClassName="bg-purple-50"
      />
      <StatCard
        title="השאלות פעילות"
        value={activeLoansCount?.count || 0}
        icon={FileText}
        description="נמסרו"
      />
      <StatCard
        title="ממתינות לאישור"
        value={pendingRequests}
        icon={Clock}
        iconClassName="bg-amber-50"
      />
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  create_request: "יצירת השאלה",
  approve_request: "אישור השאלה",
  reject_request: "דחיית השאלה",
  handover_item: "מסירת ציוד",
  return_item: "החזרת ציוד",
  create_user: "יצירת משתמש",
  update_user: "עדכון משתמש",
  create_department: "יצירת מחלקה",
  update_department: "עדכון מחלקה",
  create_item_type: "יצירת סוג ציוד",
  update_item_type: "עדכון סוג ציוד",
  add_serial_unit: "הוספת יחידה",
  intake_quantity: "קליטת כמות",
};

async function RecentAuditLogs() {
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 6,
    with: {
      user: {
        columns: { firstName: true, lastName: true },
      },
    },
  });

  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `לפני ${mins} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${days} ימים`;
  }

  function getDetails(log: (typeof logs)[0]): string {
    const nv = log.newValues as Record<string, unknown> | null;
    if (!nv) return log.action;
    if (log.entityType === "request" && log.entityId)
      return `השאלה #${String(log.entityId).slice(0, 8)}`;
    if (log.entityType === "user" && nv.firstName)
      return `משתמש ${nv.firstName} ${nv.lastName || ""}`;
    return log.action;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          יומן פעילות אחרון
        </CardTitle>
        <Link href="/super-admin/audit-log">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">אין פעילות אחרונה</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {log.user
                        ? `${log.user.firstName} ${log.user.lastName}`
                        : "מערכת"}
                    </span>
                    <Badge variant="secondary">
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{getDetails(log)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatTimeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const actions = [
    {
      href: "/super-admin/users/new",
      icon: Users,
      label: "הוסף משתמש",
      description: "צור משתמש חדש במערכת",
      show: true,
    },
    {
      href: "/super-admin/departments/new",
      icon: Building2,
      label: "הוסף מחלקה",
      description: "צור מחלקה חדשה",
      show: true,
    },
    {
      href: "/super-admin/categories",
      icon: Package,
      label: "ניהול קטגוריות",
      description: "הגדר קטגוריות ציוד",
      show: true,
    },
    {
      href: "/super-admin/reports",
      icon: FileText,
      label: "דוחות",
      description: "צפה בדוחות מערכת",
      show: true,
    },
    {
      href: "/super-admin/settings",
      icon: Settings,
      label: "הגדרות מערכת",
      description: "הגדרות כלליות",
      show: isSuperAdmin,
    },
    {
      href: "/super-admin/base",
      icon: Database,
      label: "ניהול בסיס",
      description: "פתיחה/סגירה של תקופות",
      show: isSuperAdmin,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions
            .filter((a) => a.show)
            .map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{action.label}</p>
                    <p className="text-sm text-slate-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function SystemAlerts() {
  const lowStockItems = await db.query.itemTypes.findMany({
    where: eq(itemTypes.type, "quantity"),
    columns: { id: true, name: true, quantityAvailable: true, minimumAlert: true },
    with: {
      department: { columns: { name: true } },
    },
  });

  const lowStockAlerts = lowStockItems.filter(
    (item) =>
      (item.minimumAlert ?? 0) > 0 &&
      (item.quantityAvailable ?? 0) <= (item.minimumAlert ?? 0)
  );

  const overdueCount = await db
    .select({ count: count() })
    .from(requests)
    .where(eq(requests.status, "overdue"));

  const overdueNum = overdueCount[0]?.count || 0;

  const alerts: { id: string; type: "warning" | "error"; message: string; department: string; href?: string }[] = [];

  for (const item of lowStockAlerts) {
    alerts.push({
      id: `low-${item.id}`,
      type: "warning",
      message: `מלאי נמוך: ${item.name} (${item.quantityAvailable ?? 0} יח')`,
      department: item.department?.name || "-",
      href: `/dashboard/inventory/${item.id}`,
    });
  }

  if (overdueNum > 0) {
    alerts.push({
      id: "overdue",
      type: "error",
      message: `${overdueNum} פריטים באיחור החזרה`,
      department: "כללי",
      href: "/dashboard/loans",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-5 h-5" />
          התראות מערכת
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-100"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 ${alert.type === "error" ? "text-red-500" : "text-amber-500"}`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500">{alert.department}</p>
                </div>
              </div>
              {alert.href && (
                <Link href={alert.href}>
                  <Button size="sm" variant="outline">
                    טפל
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function SuperAdminPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const isSuperAdmin = session.user.role === "super_admin";

  return (
    <div>
      <PageHeader
        title="אזור ניהול"
        description={
          isSuperAdmin
            ? "ניהול מלא של המערכת"
            : "ניהול תפעולי ודוחות"
        }
      />

      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <AdminStats />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <SystemAlerts />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions isSuperAdmin={isSuperAdmin} />

          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <RecentAuditLogs />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

