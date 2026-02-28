import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Calendar,
  Clock,
  User,
  Package,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { formatDate, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, and, gte, isNotNull, or } from "drizzle-orm";
import type { SessionUser } from "@/types";

interface ScheduledRequest {
  id: string;
  scheduledPickupAt: Date;
  status: string;
  quantity: number;
  recipientName: string | null;
  recipientPhone: string | null;
  requester: { firstName: string; lastName: string; phone: string } | null;
  itemType: { name: string } | null;
}

function groupByDate(requests: ScheduledRequest[]): Record<string, ScheduledRequest[]> {
  const grouped: Record<string, ScheduledRequest[]> = {};

  for (const req of requests) {
    const dateKey = req.scheduledPickupAt.toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(req);
  }

  // Sort by time within each date
  for (const date in grouped) {
    grouped[date].sort((a, b) =>
      a.scheduledPickupAt.getTime() - b.scheduledPickupAt.getTime()
    );
  }

  return grouped;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split("T")[0]) {
    return "היום";
  }
  if (dateStr === tomorrow.toISOString().split("T")[0]) {
    return "מחר";
  }

  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

async function getScheduledRequests(user: SessionUser) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let allRequests = await db.query.requests.findMany({
    where: and(
      isNotNull(requests.scheduledPickupAt),
      gte(requests.scheduledPickupAt, today),
      or(
        eq(requests.status, "submitted"),
        eq(requests.status, "approved"),
        eq(requests.status, "ready_for_pickup")
      )
    ),
    with: {
      requester: {
        columns: { firstName: true, lastName: true, phone: true },
      },
      itemType: {
        columns: { name: true },
      },
    },
    orderBy: (requests, { asc }) => [asc(requests.scheduledPickupAt)],
  });

  // Filter by user's department if not super admin
  if (user.role === "dept_commander" && user.departmentId) {
    allRequests = allRequests.filter((r) => r.departmentId === user.departmentId);
  }

  return allRequests.filter((r) => r.scheduledPickupAt !== null) as ScheduledRequest[];
}

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can see schedule
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const scheduledRequests = await getScheduledRequests(session.user as SessionUser);
  const groupedRequests = groupByDate(scheduledRequests);
  const dates = Object.keys(groupedRequests).sort();

  const todayCount = groupedRequests[new Date().toISOString().split("T")[0]]?.length || 0;

  return (
    <div>
      <PageHeader
        title="לוח תורים"
        description={`${scheduledRequests.length} תורים מתוזמנים${todayCount > 0 ? ` • ${todayCount} היום` : ""}`}
        actions={
          <Link href="/dashboard/handover">
            <Button>
              <Package className="w-4 h-4" />
              מסירה והחזרה
            </Button>
          </Link>
        }
      />

      {scheduledRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Calendar}
              title="אין תורים מתוזמנים"
              description="כרגע אין השאלות מתוזמנות להמתנה"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dates.map((dateKey) => (
            <Card key={dateKey}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  {formatDateHebrew(dateKey)}
                  <Badge variant="secondary" className="mr-2">
                    {groupedRequests[dateKey].length} תורים
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedRequests[dateKey].map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-mono font-medium text-lg">
                            {formatTime(request.scheduledPickupAt)}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-slate-200" />

                        {/* Details */}
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">
                              {request.recipientName || `${request.requester?.firstName || ""} ${request.requester?.lastName || ""}`.trim() || "-"}
                            </span>
                            <span className="text-sm text-slate-500" dir="ltr">
                              {request.recipientPhone || request.requester?.phone || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {request.itemType?.name}
                              {request.quantity > 1 && ` (${request.quantity} יח')`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        <Link href={`/dashboard/requests/${request.id}`}>
                          <Button variant="outline" size="sm">
                            צפה
                            <ArrowLeft className="w-4 h-4 mr-1" />
                          </Button>
                        </Link>
                        {request.status === "approved" && (
                          <Link href={`/dashboard/handover/${request.id}`}>
                            <Button size="sm">
                              <CheckCircle className="w-4 h-4" />
                              מסור
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

