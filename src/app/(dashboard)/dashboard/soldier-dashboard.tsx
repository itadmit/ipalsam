import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  FileText,
  Clock,
  Plus,
  History,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { QuickRequestCard } from "./quick-request-card";
import { OpenRequestCard } from "./open-request-card";
import type { SessionUser } from "@/types";
import { getStatusColor, getStatusLabel, formatDateTime, formatDate } from "@/lib/utils";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

interface SoldierDashboardProps {
  user: SessionUser;
}

async function MyRequests({ userId }: { userId: string }) {
  const activeStatuses = ["submitted", "approved", "ready_for_pickup", "rejected"] as const;
  const userRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requesterId, userId),
      inArray(requests.status, [...activeStatuses])
    ),
    with: { itemType: true, department: true, requester: true },
    orderBy: [desc(requests.createdAt)],
  });

  const grouped = new Map<string, (typeof userRequests)[0][]>();
  for (const r of userRequests) {
    const key = r.requestGroupId ?? r.id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const displayRequests = Array.from(grouped.entries())
    .map(([key, items]) => {
      const first = items[0];
      const recipientName =
        first.recipientName ||
        (first.requester
          ? `${first.requester.firstName || ""} ${first.requester.lastName || ""}`.trim()
          : "") ||
        "-";
      const recipientPhone = first.recipientPhone || first.requester?.phone || "-";
      return {
        id: key,
        firstId: first.id,
        recipientName,
        recipientPhone,
        reqs: items.map((r) => ({
          id: r.id,
          itemType: r.itemType,
          quantity: r.quantity,
        })),
        departmentName: first.department?.name || "",
        urgency: first.urgency,
        status: first.status,
        createdAt: formatDateTime(first.createdAt),
        notes: first.notes,
        rejectionReason: first.rejectionReason,
      };
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          ההשאלות שלי
        </CardTitle>
        <Link href="/dashboard/requests/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            השאלה חדשה
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {displayRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין השאלות פעילות"
            description="לחץ על 'השאלה חדשה' כדי להגיש השאלה לציוד"
          />
        ) : (
          <div className="space-y-4">
            {displayRequests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/requests/${request.firstId}`}
                className="block w-full text-right p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{request.recipientName}</p>
                    <p className="text-sm text-slate-500 truncate" dir="ltr">
                      {request.recipientPhone}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {request.reqs
                        .map((r) => `${r.itemType?.name || ""}${r.quantity > 1 ? ` (${r.quantity})` : ""}`)
                        .join(" • ")}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant={request.urgency === "immediate" ? "destructive" : "info"}
                        className="text-xs"
                      >
                        {request.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                      </Badge>
                      <Badge className={`${getStatusColor(request.status)} text-xs`}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <span className="text-xs text-slate-400">{request.createdAt}</span>
                    </div>
                    {(request.notes || request.rejectionReason) && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {request.rejectionReason || request.notes}
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function MyLoans({ userId }: { userId: string }) {
  const rawLoans = await db.query.requests.findMany({
    where: and(
      eq(requests.requesterId, userId),
      eq(requests.status, "handed_over")
    ),
    with: { itemType: true, itemUnit: true, department: true },
    orderBy: (requests, { asc }) => [asc(requests.scheduledReturnAt)],
  });

  const now = new Date();
  const loans = rawLoans.map((r) => {
    const dueDate = r.scheduledReturnAt || new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const itemLabel = r.itemUnit?.serialNumber
      ? `${r.itemType?.name || "פריט"} #${r.itemUnit.serialNumber}`
      : `${r.itemType?.name || "פריט"}${r.quantity > 1 ? ` (${r.quantity} יח')` : ""}`;
    return {
      id: r.id,
      item: itemLabel,
      department: r.department?.name || "",
      borrowedAt: r.handedOverAt ? formatDate(r.handedOverAt) : formatDate(r.createdAt),
      dueDate: formatDate(r.scheduledReturnAt),
      daysLeft,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          ציוד בהשאלה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loans.length === 0 ? (
          <EmptyState
            icon={Package}
            title="אין ציוד בהשאלה"
            description="כרגע אין לך ציוד מושאל"
          />
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className={`p-4 rounded-lg border ${
                  loan.daysLeft <= 1
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{loan.item}</p>
                    <p className="text-sm text-slate-500">{loan.department}</p>
                  </div>
                  {loan.daysLeft <= 1 ? (
                    <Badge variant="warning">
                      {loan.daysLeft === 0 ? "היום!" : "מחר"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{loan.daysLeft} ימים</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  <span>נלקח: {loan.borrowedAt}</span>
                  <span>להחזרה: {loan.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function RecentActivity({ userId }: { userId: string }) {
  const userRequests = await db.query.requests.findMany({
    where: eq(requests.requesterId, userId),
    with: { itemType: true, itemUnit: true },
    orderBy: [desc(requests.createdAt)],
  });

  type Activity = { id: string; action: string; date: string; type: "borrow" | "return" | "approved"; ts: Date };
  const activities: Activity[] = [];

  for (const r of userRequests) {
    const itemLabel = r.itemUnit?.serialNumber
      ? `${r.itemType?.name || "פריט"} #${r.itemUnit.serialNumber}`
      : `${r.itemType?.name || "פריט"}${r.quantity > 1 ? ` (${r.quantity} יח')` : ""}`;

    if (r.returnedAt) {
      activities.push({
        id: `${r.id}-return`,
        action: `החזרת ${itemLabel}`,
        date: formatDateTime(r.returnedAt),
        type: "return",
        ts: r.returnedAt,
      });
    }
    if (r.handedOverAt) {
      activities.push({
        id: `${r.id}-handover`,
        action: `השאלת ${itemLabel}`,
        date: formatDateTime(r.handedOverAt),
        type: "borrow",
        ts: r.handedOverAt,
      });
    }
    if (r.approvedAt) {
      activities.push({
        id: `${r.id}-approved`,
        action: `השאלה ל${itemLabel} אושרה`,
        date: formatDateTime(r.approvedAt),
        type: "approved",
        ts: r.approvedAt,
      });
    }
  }

  activities.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  const displayActivities = activities.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <EmptyState
            icon={History}
            title="אין פעילות אחרונה"
            description="פעולות ההשאלה וההחזרה שלך יופיעו כאן"
          />
        ) : (
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === "return"
                    ? "bg-green-100"
                    : activity.type === "approved"
                      ? "bg-blue-100"
                      : "bg-slate-100"
                }`}
              >
                {activity.type === "return" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : activity.type === "approved" ? (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                ) : (
                  <Package className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-slate-900">{activity.action}</p>
                <p className="text-xs text-slate-500">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SoldierDashboard({ user }: SoldierDashboardProps) {
  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="ההשאלות והציוד שלי"
        actions={
          <Link href="/dashboard/requests/new">
            <Button>
              <Plus className="w-4 h-4" />
              השאלה חדשה
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<div className="h-48 rounded-xl bg-slate-100 animate-pulse" />}>
        <QuickRequestCard userId={user.id} />
      </Suspense>

      <Suspense fallback={<div className="h-32 rounded-xl bg-slate-100 animate-pulse" />}>
        <OpenRequestCard userId={user.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <MyRequests userId={user.id} />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <MyLoans userId={user.id} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <RecentActivity userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

