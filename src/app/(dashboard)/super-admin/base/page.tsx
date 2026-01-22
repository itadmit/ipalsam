import { auth, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Calendar,
  Play,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { SessionUser } from "@/types";
import { BaseActions, PeriodActions } from "./base-actions";

async function getBaseInfo() {
  // TODO: Fetch from DB
  return {
    id: "1",
    name: "בסיס מרכזי",
    status: "active" as const,
    commanderName: "ניסם חדד",
    commanderPhone: "0527320191",
    openDate: new Date("2026-01-01"),
    currentPeriod: {
      id: "1",
      name: "תעסוקה ינואר 2026",
      startDate: new Date("2026-01-01"),
      isActive: true,
    },
    stats: {
      departments: 6,
      users: 156,
      items: 1250,
      activeLoans: 245,
    },
  };
}

export default async function BaseManagementPage() {
  const session = await auth();

  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const base = await getBaseInfo();

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
                  <p className="font-medium">{base.commanderName}</p>
                  <p className="text-sm text-slate-500" dir="ltr">{base.commanderPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">תאריך פתיחה</p>
                  <p className="font-medium">{formatDate(base.openDate)}</p>
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
              {base.currentPeriod ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                      <p className="font-semibold text-emerald-900">
                        {base.currentPeriod.name}
                      </p>
                      <p className="text-sm text-emerald-700">
                        התחלה: {formatDate(base.currentPeriod.startDate)}
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
                    periodName={base.currentPeriod.name}
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
              <PeriodActions periodId={base.currentPeriod?.id || ""} />
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
                <span className="text-xl font-bold">{base.stats.departments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">משתמשים</span>
                <span className="text-xl font-bold">{base.stats.users}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">פריטי ציוד</span>
                <span className="text-xl font-bold">{base.stats.items.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">השאלות פעילות</span>
                <span className="text-xl font-bold">{base.stats.activeLoans}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תקופות קודמות</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-slate-500 py-4">
                אין תקופות קודמות
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
