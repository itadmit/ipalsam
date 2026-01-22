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
    };
  });
}

export default async function LoansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can see all loans
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const loans = await getActiveLoans();
  const overdueCount = loans.filter(l => l.daysLeft < 0).length;

  return (
    <div>
      <PageHeader
        title="השאלות פעילות"
        description={`${loans.length} פריטים בהשאלה${overdueCount > 0 ? ` • ${overdueCount} באיחור` : ""}`}
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
                {overdueCount} פריטים באיחור!
              </p>
              <p className="text-sm text-red-600">
                יש פריטים שלא הוחזרו בזמן. יש לטפל בהם בהקדם.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי שם, טלפון או מספר פריט..."
              className="sm:w-80"
            />
          </div>

          {loans.length === 0 ? (
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
                    <TableHead>מחזיק</TableHead>
                    <TableHead>פריט</TableHead>
                    <TableHead>מחלקה</TableHead>
                    <TableHead>תאריך השאלה</TableHead>
                    <TableHead>להחזרה</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow
                      key={loan.id}
                      className={loan.daysLeft < 0 ? "bg-red-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {loan.requester?.firstName} {loan.requester?.lastName}
                          </p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {loan.requester?.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{loan.itemType?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{loan.department?.name}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(loan.handedOverAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(loan.scheduledReturnAt)}
                      </TableCell>
                      <TableCell>
                        {loan.daysLeft < 0 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 ml-1" />
                            {Math.abs(loan.daysLeft)} ימים באיחור
                          </Badge>
                        ) : loan.daysLeft === 0 ? (
                          <Badge variant="warning">היום!</Badge>
                        ) : loan.daysLeft <= 2 ? (
                          <Badge variant="warning">{loan.daysLeft} ימים</Badge>
                        ) : (
                          <Badge variant="secondary">{loan.daysLeft} ימים</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/handover/${loan.id}/return`}>
                          <Button size="sm" variant="outline">
                            קבל החזרה
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
