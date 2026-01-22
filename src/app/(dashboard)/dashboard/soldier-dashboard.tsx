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
} from "lucide-react";
import type { SessionUser } from "@/types";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface SoldierDashboardProps {
  user: SessionUser;
}

async function MyRequests() {
  // TODO: Replace with actual data
  const requests = [
    {
      id: "1",
      item: "מכשיר קשר",
      department: "קשר",
      quantity: 1,
      status: "submitted",
      createdAt: "22/01/2026 09:30",
    },
    {
      id: "2",
      item: "סוללות",
      department: "אפסנאות",
      quantity: 5,
      status: "approved",
      createdAt: "21/01/2026 14:15",
    },
    {
      id: "3",
      item: "אוזניות",
      department: "קשר",
      quantity: 1,
      status: "ready_for_pickup",
      createdAt: "20/01/2026 11:00",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          הבקשות שלי
        </CardTitle>
        <Link href="/dashboard/requests/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            בקשה חדשה
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="אין בקשות פעילות"
            description="לחץ על 'בקשה חדשה' כדי להגיש בקשה להשאלת ציוד"
          />
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/dashboard/requests/${request.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {request.item}
                      {request.quantity > 1 && ` (${request.quantity} יח')`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {request.department} • {request.createdAt}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function MyLoans() {
  // TODO: Replace with actual data
  const loans = [
    {
      id: "1",
      item: "מכשיר קשר #K-1234",
      department: "קשר",
      borrowedAt: "20/01/2026",
      dueDate: "27/01/2026",
      daysLeft: 5,
    },
    {
      id: "2",
      item: "מחשב נייד #L-5678",
      department: "לוגיסטיקה",
      borrowedAt: "15/01/2026",
      dueDate: "22/01/2026",
      daysLeft: 0,
    },
  ];

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

async function RecentActivity() {
  // TODO: Replace with actual data
  const activities = [
    {
      id: "1",
      action: "השאלת מכשיר קשר #K-1234",
      date: "20/01/2026 10:00",
      type: "borrow",
    },
    {
      id: "2",
      action: "החזרת סוללות (10 יח')",
      date: "18/01/2026 14:30",
      type: "return",
    },
    {
      id: "3",
      action: "בקשה לאוזניות אושרה",
      date: "17/01/2026 09:15",
      type: "approved",
    },
    {
      id: "4",
      action: "השאלת מחשב נייד #L-5678",
      date: "15/01/2026 11:00",
      type: "borrow",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
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
      </CardContent>
    </Card>
  );
}

export function SoldierDashboard({ user }: SoldierDashboardProps) {
  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="הבקשות והציוד שלי"
        actions={
          <Link href="/dashboard/requests/new">
            <Button>
              <Plus className="w-4 h-4" />
              בקשה חדשה
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <MyRequests />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <MyLoans />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  );
}

