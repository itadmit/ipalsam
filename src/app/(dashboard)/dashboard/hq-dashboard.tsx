import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Building2,
  Package,
  FileText,
  AlertTriangle,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { QuickRequestCard } from "./quick-request-card";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { departments, itemTypes, requests, users } from "@/db/schema";
import { eq, count, sql, and } from "drizzle-orm";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface HQDashboardProps {
  user: SessionUser;
}

async function DashboardStats() {
  const [deptCount] = await db
    .select({ count: count() })
    .from(departments)
    .where(and(eq(departments.isActive, true), eq(departments.visibleInHqDashboard, true)));
  const [itemCount] = await db.select({ count: count() }).from(itemTypes);
  const [pendingCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(eq(requests.status, "submitted"));
  const [overdueCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(eq(requests.status, "overdue"));

  const stats = {
    totalDepartments: deptCount?.count || 0,
    totalItems: itemCount?.count || 0,
    pendingRequests: pendingCount?.count || 0,
    overdueItems: overdueCount?.count || 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="מחלקות פעילות"
        value={stats.totalDepartments}
        icon={Building2}
        description={`${stats.totalDepartments} מחלקות בבסיס`}
      />
      <StatCard
        title="סוגי פריטים"
        value={stats.totalItems}
        icon={Package}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="השאלות ממתינות"
        value={stats.pendingRequests}
        icon={FileText}
        iconClassName="bg-amber-50"
      />
      <StatCard
        title="פריטים באיחור"
        value={stats.overdueItems}
        icon={AlertTriangle}
        iconClassName="bg-red-50"
      />
    </div>
  );
}

async function DepartmentOverview() {
  const depts = await db.query.departments.findMany({
    where: and(
      eq(departments.isActive, true),
      eq(departments.visibleInHqDashboard, true)
    ),
    with: {
      itemTypes: true,
    },
  });

  if (depts.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>סטטוס מחלקות</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="אין מחלקות"
            description="הוסף מחלקות כדי להתחיל"
            action={
              <Link href="/super-admin/departments/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  הוסף מחלקה
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>סטטוס מחלקות</CardTitle>
        <Link href="/dashboard/departments">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {depts.map((dept) => (
            <Link
              key={dept.id}
              href={`/dashboard/departments/${dept.id}`}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{dept.name}</p>
                  <p className="text-sm text-slate-500">
                    {dept.itemTypes?.length || 0} סוגי פריטים
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

async function RecentRequests() {
  const recentRequests = await db.query.requests.findMany({
    limit: 5,
    orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    with: {
      requester: true,
      itemType: true,
      department: true,
    },
  });

  if (recentRequests.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>השאלות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="אין השאלות"
            description="עדיין לא הוגשו השאלות במערכת"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>השאלות אחרונות</CardTitle>
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentRequests.map((request) => (
            <Link
              key={request.id}
              href={`/dashboard/requests/${request.id}`}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {request.itemType?.name || "פריט"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {request.recipientName || `${request.requester?.firstName || ""} ${request.requester?.lastName || ""}`.trim() || "-"} • {request.department?.name}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function CriticalAlerts() {
  // Get overdue requests
  const overdueRequests = await db.query.requests.findMany({
    where: eq(requests.status, "overdue"),
    limit: 5,
    with: {
      requester: true,
      itemType: true,
    },
  });

  if (overdueRequests.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          חריגים דורשי טיפול
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overdueRequests.map((req) => (
            <Link
              key={req.id}
              href={`/dashboard/requests/${req.id}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-red-100 hover:border-red-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {req.itemType?.name} באיחור
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {req.recipientName || `${req.requester?.firstName || ""} ${req.requester?.lastName || ""}`.trim() || "-"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HQDashboard({ user }: HQDashboardProps) {
  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="דשבורד מפקדה - תמונת מצב כללית"
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף ציוד
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <DashboardStats />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <CriticalAlerts />
        </Suspense>

        <Suspense fallback={<div className="h-48 rounded-xl bg-slate-100 animate-pulse" />}>
          <QuickRequestCard userId={user.id} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <DepartmentOverview />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <RecentRequests />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
