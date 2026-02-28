import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  ArrowRight,
  ArrowLeftRight,
  User,
  CheckCircle,
} from "lucide-react";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { formatDateTime } from "@/lib/utils";

export default async function HandoverPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can do handover
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  // Get approved requests pending handover
  const pendingHandovers = await db.query.requests.findMany({
    where: or(
      eq(requests.status, "approved"),
      eq(requests.status, "ready_for_pickup")
    ),
    with: {
      requester: true,
      itemType: true,
    },
    orderBy: (requests, { desc }) => [desc(requests.approvedAt)],
  });

  // Get items currently on loan (handed over) - group by requestGroupId
  const activeLoansRaw = await db.query.requests.findMany({
    where: eq(requests.status, "handed_over"),
    with: {
      requester: true,
      itemType: true,
    },
    orderBy: (requests, { asc }) => [asc(requests.scheduledReturnAt)],
  });
  const loanGroups = new Map<string, typeof activeLoansRaw>();
  for (const loan of activeLoansRaw) {
    const key = loan.requestGroupId ?? loan.id;
    if (!loanGroups.has(key)) loanGroups.set(key, []);
    loanGroups.get(key)!.push(loan);
  }
  const activeLoans = Array.from(loanGroups.entries()).map(([groupKey, loans]) => ({
    groupKey,
    loans,
    first: loans[0],
  }));

  return (
    <div>
      <PageHeader
        title="מסירה והחזרה"
        description="ביצוע מסירות ציוד וקבלת החזרות"
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה למלאי
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Handovers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              ממתינים למסירה
              {pendingHandovers.length > 0 && (
                <Badge variant="warning">{pendingHandovers.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingHandovers.length === 0 ? (
              <EmptyState
                icon={Package}
                title="אין השאלות ממתינות"
                description="כל ההשאלות שאושרו נמסרו"
              />
            ) : (
              <div className="space-y-4">
                {pendingHandovers.map((handover) => (
                  <div
                    key={handover.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {handover.recipientName || `${handover.requester?.firstName || ""} ${handover.requester?.lastName || ""}`.trim() || "-"}
                          </p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {handover.recipientPhone || handover.requester?.phone || "-"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">אושר</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>
                        {handover.itemType?.name}
                        {handover.quantity > 1 && ` (${handover.quantity} יח')`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        אושר: {formatDateTime(handover.approvedAt)}
                      </span>
                      <Link href={`/dashboard/handover/${handover.id}`}>
                        <Button size="sm">
                          <ArrowLeftRight className="w-4 h-4" />
                          בצע מסירה
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              בהשאלה - לקבלת החזרה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <SearchBar placeholder="חיפוש לפי שם או מספר פריט..." />
            </div>
            {activeLoans.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="אין פריטים בהשאלה"
                description="כל הפריטים הוחזרו"
              />
            ) : (
              <div className="space-y-4">
                {activeLoans.map(({ groupKey, loans, first }) => {
                  const dueDate = first.scheduledReturnAt;
                  const isOverdue = dueDate && new Date() > dueDate;

                  return (
                    <div
                      key={groupKey}
                      className={`p-4 rounded-lg border ${
                        isOverdue
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isOverdue ? "bg-red-100" : "bg-slate-100"
                            }`}
                          >
                            <User
                              className={`w-5 h-5 ${
                                isOverdue ? "text-red-500" : "text-slate-500"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">
                              {first.recipientName || `${first.requester?.firstName || ""} ${first.requester?.lastName || ""}`.trim() || "-"}
                            </p>
                            <p className="text-sm text-slate-500" dir="ltr">
                              {first.recipientPhone || first.requester?.phone || "-"}
                            </p>
                          </div>
                        </div>
                        {isOverdue && (
                          <Badge variant="destructive">באיחור!</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>
                          {loans.map((l) => l.itemType?.name).join(", ")}
                          {loans.length > 1 && ` (${loans.length} פריטים)`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <span>הושאל: {formatDateTime(first.handedOverAt)}</span>
                        </div>
                        <Link href={`/dashboard/handover/group/${groupKey}/return`}>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="w-4 h-4" />
                            סמן כהוחזר
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
