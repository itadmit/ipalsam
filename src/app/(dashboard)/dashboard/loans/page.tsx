import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getActiveLoans() {
  const loans = await db.query.requests.findMany({
    where: eq(requests.status, "handed_over"),
    with: {
      requester: true,
      itemType: true,
      department: true,
    },
    orderBy: (requests, { asc }) => [asc(requests.scheduledReturnAt)],
  });

  return loans.map((loan) => {
    const dueDate = loan.scheduledReturnAt || new Date();
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      ...loan,
      daysLeft,
      groupKey: loan.requestGroupId ?? loan.id,
    };
  });
}

function groupLoans(loans: Awaited<ReturnType<typeof getActiveLoans>>) {
  const groups = new Map<
    string,
    { loans: typeof loans; minDaysLeft: number; earliestDue: Date }
  >();

  for (const loan of loans) {
    const key = loan.groupKey;
    const existing = groups.get(key);
    if (existing) {
      existing.loans.push(loan);
      existing.minDaysLeft = Math.min(existing.minDaysLeft, loan.daysLeft);
      if (loan.scheduledReturnAt && loan.scheduledReturnAt < existing.earliestDue) {
        existing.earliestDue = loan.scheduledReturnAt;
      }
    } else {
      groups.set(key, {
        loans: [loan],
        minDaysLeft: loan.daysLeft,
        earliestDue: loan.scheduledReturnAt || new Date(),
      });
    }
  }

  return Array.from(groups.entries()).map(([groupKey, { loans: groupLoans, minDaysLeft, earliestDue }]) => ({
    groupKey,
    loans: groupLoans,
    minDaysLeft,
    earliestDue,
    recipientName: groupLoans[0].recipientName || `${groupLoans[0].requester?.firstName || ""} ${groupLoans[0].requester?.lastName || ""}`.trim() || "-",
    recipientPhone: groupLoans[0].recipientPhone || groupLoans[0].requester?.phone || "-",
    handedOverAt: groupLoans[0].handedOverAt,
  }));
}

export default async function LoansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const loans = await getActiveLoans();
  const groups = groupLoans(loans);
  const overdueCount = groups.filter((g) => g.minDaysLeft < 0).length;
  const totalItems = loans.length;

  return (
    <div>
      <PageHeader
        title="השאלות פעילות"
        description={`${groups.length} השאלות • ${totalItems} פריטים${overdueCount > 0 ? ` • ${overdueCount} באיחור` : ""}`}
        actions={
          <Link href="/dashboard/handover">
            <Button>
              <CheckCircle className="w-4 h-4" />
              קבל החזרה
            </Button>
          </Link>
        }
      />

      {overdueCount > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                {overdueCount} השאלות באיחור!
              </p>
              <p className="text-sm text-red-600">
                יש השאלות שלא הוחזרו בזמן. יש לטפל בהן בהקדם.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי שם, טלפון או פריט..."
              className="sm:w-80"
            />
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={Package}
              title="אין השאלות פעילות"
              description="כרגע אין פריטים מושאלים"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>חייל מבקש</TableHead>
                    <TableHead>פריטים</TableHead>
                    <TableHead>מחלקה</TableHead>
                    <TableHead>תאריך השאלה</TableHead>
                    <TableHead>להחזרה</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow
                      key={group.groupKey}
                      className={group.minDaysLeft < 0 ? "bg-red-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.recipientName}</p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {group.recipientPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {group.loans.map((l) => (
                            <p key={l.id} className="text-sm">
                              {l.itemType?.name}
                              {l.quantity > 1 && ` (${l.quantity} יח')`}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{group.loans[0].department?.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {group.handedOverAt && formatDate(group.handedOverAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(group.earliestDue)}
                      </TableCell>
                      <TableCell>
                        {group.minDaysLeft < 0 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            {Math.abs(group.minDaysLeft)} ימים באיחור
                          </Badge>
                        ) : group.minDaysLeft === 0 ? (
                          <Badge variant="warning">היום!</Badge>
                        ) : group.minDaysLeft <= 2 ? (
                          <Badge variant="warning">{group.minDaysLeft} ימים</Badge>
                        ) : (
                          <Badge variant="secondary">{group.minDaysLeft} ימים</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/handover/group/${group.groupKey}/return`}>
                          <Button size="sm" variant="outline">
                            הוחזר
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
