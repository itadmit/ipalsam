import { auth, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Database,
  Calendar,
  Play,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { BaseActions, PeriodActions } from "./base-actions";
import { db } from "@/db";
import { bases, departments, users, itemTypes, requests, operationalPeriods } from "@/db/schema";
import { eq, count, and, desc } from "drizzle-orm";

export default async function BaseManagementPage() {
  const session = await auth();

  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  // Get base info
  const base = await db.query.bases.findFirst();

  if (!base) {
    return (
      <div>
        <PageHeader
          title="ניהול בסיס"
          description="ניהול תקופות, פתיחה וסגירה"
        />
        <EmptyState
          icon={Database}
          title="אין בסיס"
          description="יש לאפס את המערכת כדי ליצור בסיס"
        />
      </div>
    );
  }

  // Get current period
  const currentPeriod = await db.query.operationalPeriods.findFirst({
    where: and(
      eq(operationalPeriods.baseId, base.id),
      eq(operationalPeriods.isActive, true)
    ),
  });

  // Get past periods
  const pastPeriods = await db.query.operationalPeriods.findMany({
    where: and(
      eq(operationalPeriods.baseId, base.id),
      eq(operationalPeriods.isActive, false)
    ),
    orderBy: [desc(operationalPeriods.endDate)],
    limit: 5,
  });

  // Get stats
  const [deptCount] = await db.select({ count: count() }).from(departments).where(eq(departments.baseId, base.id));
  const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.baseId, base.id));
  const [itemCount] = await db.select({ count: count() }).from(itemTypes);
  const [activeLoansCount] = await db.select({ count: count() }).from(requests).where(eq(requests.status, "handed_over"));

  const stats = {
    departments: deptCount?.count || 0,
    users: userCount?.count || 0,
    items: itemCount?.count || 0,
    activeLoans: activeLoansCount?.count || 0,
  };

  return (
    <div>
      <PageHeader
        title="ניהול בסיס"
        description="ניהול תקופות, פתיחה וסגירה"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                פרטי הבסיס
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">שם הבסיס</p>
                  <p className="text-lg font-semibold">{base.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">סטטוס</p>
                  <Badge
                    variant={base.status === "active" ? "success" : "warning"}
                    className="mt-1"
                  >
                    {base.status === "active" ? "פעיל" : base.status === "folding" ? "בקיפול" : "סגור"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">מפקד</p>
                  <p className="font-medium">{base.commanderName || "-"}</p>
                  <p className="text-sm text-slate-500" dir="ltr">{base.commanderPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">תאריך יצירה</p>
                  <p className="font-medium">{formatDate(base.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                תקופה נוכחית
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPeriod ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                      <p className="font-semibold text-emerald-900">
                        {currentPeriod.name}
                      </p>
                      <p className="text-sm text-emerald-700">
                        התחלה: {formatDate(currentPeriod.startDate)}
                      </p>
                    </div>
                    <Badge variant="success">
                      <Play className="w-3 h-3 ml-1" />
                      פעילה
                    </Badge>
                  </div>

                  <BaseActions
                    baseId={base.id}
                    hasActivePeriod={true}
                    periodName={currentPeriod.name}
                  />
                </div>
              ) : (
                <BaseActions baseId={base.id} hasActivePeriod={false} />
              )}
            </CardContent>
          </Card>

          {/* Period Actions */}
          <Card>
            <CardHeader>
              <CardTitle>פעולות תקופה</CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodActions periodId={currentPeriod?.id || ""} />
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>סטטיסטיקות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">מחלקות</span>
                <span className="text-xl font-bold">{stats.departments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">משתמשים</span>
                <span className="text-xl font-bold">{stats.users}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">סוגי ציוד</span>
                <span className="text-xl font-bold">{stats.items.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">השאלות פעילות</span>
                <span className="text-xl font-bold">{stats.activeLoans}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תקופות קודמות</CardTitle>
            </CardHeader>
            <CardContent>
              {pastPeriods.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  אין תקופות קודמות
                </p>
              ) : (
                <div className="space-y-2">
                  {pastPeriods.map((period) => (
                    <div
                      key={period.id}
                      className="p-3 bg-slate-50 rounded-lg"
                    >
                      <p className="font-medium text-sm">{period.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
