import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  FileText,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { db } from "@/db";
import { itemTypes, requests } from "@/db/schema";
import { eq, count, and, sql } from "drizzle-orm";

interface DeptDashboardProps {
  user: SessionUser;
}

async function DeptStats({ departmentId }: { departmentId: string | null }) {
  if (!departmentId) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="סה״כ פריטים" value={0} icon={Package} />
        <StatCard title="בשימוש" value={0} icon={Users} iconClassName="bg-blue-50" />
        <StatCard title="השאלות ממתינות" value={0} icon={FileText} iconClassName="bg-amber-50" />
        <StatCard title="השאלות באיחור" value={0} icon={Clock} iconClassName="bg-red-50" />
      </div>
    );
  }

  const [itemCount] = await db
    .select({ count: count() })
    .from(itemTypes)
    .where(eq(itemTypes.departmentId, departmentId));
  
  const [pendingCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(eq(requests.departmentId, departmentId), eq(requests.status, "submitted")));

  const [inUseCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(eq(requests.departmentId, departmentId), eq(requests.status, "handed_over")));

  const [overdueCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(eq(requests.departmentId, departmentId), eq(requests.status, "overdue")));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="סוגי פריטים"
        value={itemCount?.count || 0}
        icon={Package}
      />
      <StatCard
        title="בשימוש"
        value={inUseCount?.count || 0}
        icon={Users}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="השאלות ממתינות"
        value={pendingCount?.count || 0}
        icon={FileText}
        iconClassName="bg-amber-50"
      />
      <StatCard
        title="השאלות באיחור"
        value={overdueCount?.count || 0}
        icon={Clock}
        iconClassName="bg-red-50"
      />
    </div>
  );
}

async function PendingRequests({ departmentId }: { departmentId: string | null }) {
  if (!departmentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            השאלות ממתינות לאישור
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="אין השאלות"
            description="אין השאלות ממתינות לאישור"
          />
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = await db.query.requests.findMany({
    where: and(eq(requests.departmentId, departmentId), eq(requests.status, "submitted")),
    limit: 5,
    orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    with: {
      requester: true,
      itemType: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          השאלות ממתינות לאישור
          {pendingRequests.length > 0 && (
            <Badge variant="warning">{pendingRequests.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין השאלות"
            description="אין השאלות ממתינות לאישור"
          />
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/requests/${request.id}`}
                className="block p-4 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {request.recipientName || `${request.requester?.firstName || ""} ${request.requester?.lastName || ""}`.trim() || "-"}
                    </p>
                    <p className="text-sm text-slate-500" dir="ltr">
                      {request.recipientPhone || request.requester?.phone || "-"}
                    </p>
                  </div>
                  <Badge variant={request.urgency === "immediate" ? "destructive" : "info"}>
                    {request.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>
                    {request.itemType?.name}
                    {request.quantity > 1 && ` (${request.quantity} יח')`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function ActiveLoans({ departmentId }: { departmentId: string | null }) {
  if (!departmentId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            בהשאלה עכשיו
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="אין השאלות"
            description="אין פריטים מושאלים כרגע"
          />
        </CardContent>
      </Card>
    );
  }

  const activeLoansRaw = await db.query.requests.findMany({
    where: and(eq(requests.departmentId, departmentId), eq(requests.status, "handed_over")),
    limit: 10,
    with: {
      requester: true,
      itemType: true,
    },
  });

  const loanGroups = new Map<string, typeof activeLoansRaw>();
  for (const loan of activeLoansRaw) {
    const key = loan.requestGroupId ?? loan.id;
    if (!loanGroups.has(key)) loanGroups.set(key, []);
    loanGroups.get(key)!.push(loan);
  }
  const activeLoans = Array.from(loanGroups.entries())
    .slice(0, 5)
    .map(([groupKey, loans]) => ({ groupKey, loans, first: loans[0] }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          בהשאלה עכשיו
        </CardTitle>
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {activeLoans.length === 0 ? (
          <EmptyState
            icon={Users}
            title="אין השאלות"
            description="אין פריטים מושאלים כרגע"
          />
        ) : (
          <div className="space-y-3">
            {activeLoans.map(({ groupKey, loans, first }) => (
              <Link
                key={groupKey}
                href={`/dashboard/handover/group/${groupKey}/return`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {(first.recipientName || `${first.requester?.firstName || ""} ${first.requester?.lastName || ""}`.trim())
                        .split(" ")
                        .map((s) => s.charAt(0))
                        .join("")
                        .slice(0, 2) || "-"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {first.recipientName || `${first.requester?.firstName || ""} ${first.requester?.lastName || ""}`.trim() || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {loans.map((l) => l.itemType?.name).join(", ")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function InventorySummary({ departmentId }: { departmentId: string | null }) {
  if (!departmentId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            מלאי מהיר
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="אין פריטים"
            description="הוסף פריטים למלאי"
            action={
              <Link href="/dashboard/inventory/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  הוסף פריט
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const items = await db.query.itemTypes.findMany({
    where: eq(itemTypes.departmentId, departmentId),
    limit: 5,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          מלאי מהיר
        </CardTitle>
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm">
            מלאי מלא
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="אין פריטים"
            description="הוסף פריטים למלאי"
            action={
              <Link href="/dashboard/inventory/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  הוסף פריט
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const total = item.quantityTotal || 0;
              const available = item.quantityAvailable || 0;
              const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
              const isLow = percentage < 30;
              return (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {item.name}
                    </span>
                    <span className={`text-sm ${isLow ? "text-red-600" : "text-slate-600"}`}>
                      {available}/{total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DeptDashboard({ user }: DeptDashboardProps) {
  const departmentId = user.departmentId;

  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="דשבורד מחלקה - ניהול מלאי והשאלות"
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/intake">
              <Button variant="outline">
                <Plus className="w-4 h-4" />
                קליטת ציוד
              </Button>
            </Link>
            <Link href="/dashboard/handover">
              <Button>מסירה/החזרה</Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          }
        >
          <DeptStats departmentId={departmentId} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-96 rounded-xl bg-slate-100 animate-pulse" />}>
            <PendingRequests departmentId={departmentId} />
          </Suspense>

          <div className="space-y-6">
            <Suspense fallback={<div className="h-64 rounded-xl bg-slate-100 animate-pulse" />}>
              <ActiveLoans departmentId={departmentId} />
            </Suspense>

            <Suspense fallback={<div className="h-64 rounded-xl bg-slate-100 animate-pulse" />}>
              <InventorySummary departmentId={departmentId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
