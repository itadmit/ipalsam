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
import { Package, Filter, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

async function getActiveLoans() {
  // TODO: Fetch from DB
  return [
    {
      id: "1",
      holder: "יוסי כהן",
      phone: "0541234567",
      item: "מכשיר קשר דגם X",
      serialNumber: "K-2341-015",
      department: "קשר",
      borrowedAt: new Date("2026-01-20"),
      dueDate: new Date("2026-01-27"),
      daysLeft: 5,
    },
    {
      id: "2",
      holder: "דנה לוי",
      phone: "0529876543",
      item: "מחשב נייד",
      serialNumber: "L-2000-008",
      department: "לוגיסטיקה",
      borrowedAt: new Date("2026-01-15"),
      dueDate: new Date("2026-01-22"),
      daysLeft: 0,
    },
    {
      id: "3",
      holder: "אבי מזרחי",
      phone: "0501112233",
      item: "אנטנה VHF",
      serialNumber: "A-1122-022",
      department: "קשר",
      borrowedAt: new Date("2026-01-10"),
      dueDate: new Date("2026-01-20"),
      daysLeft: -2,
    },
    {
      id: "4",
      holder: "שרה גולן",
      phone: "0523334455",
      item: 'סוללות AA (20 יח")',
      serialNumber: null,
      department: "אפסנאות",
      borrowedAt: new Date("2026-01-21"),
      dueDate: new Date("2026-01-28"),
      daysLeft: 6,
    },
  ];
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
        description={`${loans.length} פריטים בהשאלה • ${overdueCount} באיחור`}
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
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              סינון
            </Button>
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
                          <p className="font-medium">{loan.holder}</p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {loan.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{loan.item}</p>
                          {loan.serialNumber && (
                            <code className="text-xs bg-slate-100 px-1 rounded">
                              {loan.serialNumber}
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{loan.department}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(loan.borrowedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(loan.dueDate)}
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

