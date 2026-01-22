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

async function AdminStats() {
  // TODO: Fetch actual data
  const stats = {
    totalBases: 1,
    totalDepartments: 6,
    totalUsers: 156,
    totalItems: 1250,
    activeLoans: 245,
    pendingRequests: 12,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="מחלקות"
        value={stats.totalDepartments}
        icon={Building2}
        description="בבסיס הפעיל"
      />
      <StatCard
        title="משתמשים"
        value={stats.totalUsers}
        icon={Users}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="פריטי ציוד"
        value={stats.totalItems.toLocaleString()}
        icon={Package}
        iconClassName="bg-purple-50"
      />
    </div>
  );
}

async function RecentAuditLogs() {
  // TODO: Fetch from database
  const logs = [
    {
      id: "1",
      user: "יוגב אביטן",
      action: "יצירת משתמש",
      details: 'משתמש חדש "דני לוי" נוצר',
      time: "לפני 5 דקות",
    },
    {
      id: "2",
      user: "ניסם חדד",
      action: "אישור בקשה",
      details: "בקשה #1234 אושרה",
      time: "לפני 15 דקות",
    },
    {
      id: "3",
      user: "ולרי כהן",
      action: "מסירת ציוד",
      details: "מכשיר קשר #K-2341 נמסר",
      time: "לפני 30 דקות",
    },
    {
      id: "4",
      user: "מערכת",
      action: "התראה",
      details: "ציוד באיחור זוהה",
      time: "לפני שעה",
    },
  ];

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
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">{log.user}</span>
                  <Badge variant="secondary">{log.action}</Badge>
                </div>
                <p className="text-sm text-slate-600">{log.details}</p>
                <p className="text-xs text-slate-400 mt-1">{log.time}</p>
              </div>
            </div>
          ))}
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
  // TODO: Fetch actual alerts
  const alerts = [
    {
      id: "1",
      type: "warning",
      message: 'מלאי נמוך: סוללות AA (5 יח")',
      department: "אפסנאות",
    },
    {
      id: "2",
      type: "error",
      message: "3 פריטים באיחור החזרה",
      department: "כללי",
    },
  ];

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
              <Button size="sm" variant="outline">
                טפל
              </Button>
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

