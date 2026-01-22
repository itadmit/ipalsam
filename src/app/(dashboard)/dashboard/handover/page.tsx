import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import {
  Package,
  ArrowRight,
  ArrowLeftRight,
  User,
  CheckCircle,
} from "lucide-react";

async function getPendingHandovers() {
  // TODO: Fetch approved requests pending handover
  return [
    {
      id: "1",
      requester: "יוסי כהן",
      phone: "0541234567",
      item: "מכשיר קשר",
      itemId: "K-2341-015",
      quantity: 1,
      status: "approved",
      approvedAt: "22/01/2026 09:00",
    },
    {
      id: "2",
      requester: "דנה לוי",
      phone: "0529876543",
      item: 'סוללות AA (10 יח")',
      itemId: null,
      quantity: 10,
      status: "approved",
      approvedAt: "22/01/2026 08:30",
    },
  ];
}

async function getActiveLoans() {
  // TODO: Fetch items currently on loan
  return [
    {
      id: "1",
      holder: "אבי מזרחי",
      phone: "0501112233",
      item: "מחשב נייד",
      itemId: "L-2000-005",
      borrowedAt: "20/01/2026",
      dueDate: "27/01/2026",
      isOverdue: false,
    },
    {
      id: "2",
      holder: "שרה גולן",
      phone: "0523334455",
      item: "מכשיר קשר",
      itemId: "K-2341-022",
      borrowedAt: "15/01/2026",
      dueDate: "20/01/2026",
      isOverdue: true,
    },
  ];
}

export default async function HandoverPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can do handover
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const pendingHandovers = await getPendingHandovers();
  const activeLoans = await getActiveLoans();

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
              <Badge variant="warning">{pendingHandovers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingHandovers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                אין בקשות ממתינות למסירה
              </p>
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
                          <p className="font-medium">{handover.requester}</p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {handover.phone}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">אושר</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>{handover.item}</span>
                      {handover.itemId && (
                        <code className="bg-slate-100 px-1 rounded text-xs">
                          {handover.itemId}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        אושר: {handover.approvedAt}
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
              <p className="text-center text-slate-500 py-8">
                אין פריטים בהשאלה
              </p>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className={`p-4 rounded-lg border ${
                      loan.isOverdue
                        ? "border-red-200 bg-red-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            loan.isOverdue ? "bg-red-100" : "bg-slate-100"
                          }`}
                        >
                          <User
                            className={`w-5 h-5 ${
                              loan.isOverdue ? "text-red-500" : "text-slate-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{loan.holder}</p>
                          <p className="text-sm text-slate-500" dir="ltr">
                            {loan.phone}
                          </p>
                        </div>
                      </div>
                      {loan.isOverdue && (
                        <Badge variant="destructive">באיחור!</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>{loan.item}</span>
                      {loan.itemId && (
                        <code className="bg-slate-100 px-1 rounded text-xs">
                          {loan.itemId}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        <span>הושאל: {loan.borrowedAt}</span>
                        <span className="mx-2">•</span>
                        <span>להחזרה: {loan.dueDate}</span>
                      </div>
                      <Link href={`/dashboard/handover/${loan.id}/return`}>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="w-4 h-4" />
                          קבל החזרה
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

