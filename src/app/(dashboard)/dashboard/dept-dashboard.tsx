import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  FileText,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { SessionUser } from "@/types";

interface DeptDashboardProps {
  user: SessionUser;
}

async function DeptStats() {
  // TODO: Replace with actual data based on user's department
  const stats = {
    totalItems: 165,
    availableItems: 120,
    inUseItems: 45,
    pendingRequests: 3,
    overdueLoans: 1,
    activeUsers: 24,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="סה״כ פריטים"
        value={stats.totalItems}
        icon={Package}
        description={`${stats.availableItems} זמינים`}
      />
      <StatCard
        title="בשימוש"
        value={stats.inUseItems}
        icon={Users}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="בקשות ממתינות"
        value={stats.pendingRequests}
        icon={FileText}
        iconClassName="bg-amber-50"
      />
      <StatCard
        title="השאלות באיחור"
        value={stats.overdueLoans}
        icon={Clock}
        iconClassName="bg-red-50"
      />
    </div>
  );
}

async function PendingRequests() {
  // TODO: Replace with actual data
  const requests = [
    {
      id: "1",
      requester: "יוסי כהן",
      phone: "0541234567",
      item: "מכשיר קשר",
      quantity: 1,
      urgency: "immediate",
      purpose: "אימון",
      time: "לפני 5 דקות",
    },
    {
      id: "2",
      requester: "דנה לוי",
      phone: "0529876543",
      item: "אנטנה",
      quantity: 2,
      urgency: "scheduled",
      purpose: "תחזוקה",
      time: "לפני 15 דקות",
    },
    {
      id: "3",
      requester: "משה אברהם",
      phone: "0501112233",
      item: "סוללה למכשיר קשר",
      quantity: 5,
      urgency: "immediate",
      purpose: "החלפה",
      time: "לפני 30 דקות",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          בקשות ממתינות לאישור
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            אין בקשות ממתינות
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {request.requester}
                    </p>
                    <p className="text-sm text-slate-500" dir="ltr">
                      {request.phone}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.urgency === "immediate" ? "destructive" : "info"
                    }
                  >
                    {request.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">
                    {request.item}{" "}
                    {request.quantity > 1 && `(${request.quantity} יח')`}
                  </span>
                </div>
                {request.purpose && (
                  <p className="text-sm text-slate-500 mb-3">
                    מטרה: {request.purpose}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{request.time}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <XCircle className="w-4 h-4 ml-1" />
                      דחה
                    </Button>
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4 ml-1" />
                      אשר
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function ActiveLoans() {
  // TODO: Replace with actual data
  const loans = [
    {
      id: "1",
      holder: "יוסי כהן",
      item: "מכשיר קשר #K-1234",
      borrowedAt: "20/01/2026",
      dueDate: "27/01/2026",
      status: "active",
    },
    {
      id: "2",
      holder: "דנה לוי",
      item: 'אנטנות (2 יח")',
      borrowedAt: "18/01/2026",
      dueDate: "20/01/2026",
      status: "overdue",
    },
    {
      id: "3",
      holder: "אבי מזרחי",
      item: "מחשב נייד",
      borrowedAt: "15/01/2026",
      dueDate: "29/01/2026",
      status: "active",
    },
  ];

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
        <div className="space-y-3">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                loan.status === "overdue"
                  ? "border-red-200 bg-red-50"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    loan.status === "overdue"
                      ? "bg-red-100"
                      : "bg-slate-100"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      loan.status === "overdue"
                        ? "text-red-600"
                        : "text-slate-600"
                    }`}
                  >
                    {loan.holder
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {loan.holder}
                  </p>
                  <p className="text-xs text-slate-500">{loan.item}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-slate-600">עד {loan.dueDate}</p>
                {loan.status === "overdue" && (
                  <Badge variant="destructive" className="mt-1">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    באיחור
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function InventorySummary() {
  // TODO: Replace with actual data
  const items = [
    { name: "מכשירי קשר", available: 45, total: 60 },
    { name: "אנטנות", available: 32, total: 40 },
    { name: "סוללות", available: 150, total: 200 },
    { name: "אוזניות", available: 18, total: 25 },
    { name: "מטענים", available: 28, total: 30 },
  ];

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
        <div className="space-y-4">
          {items.map((item) => {
            const percentage = Math.round((item.available / item.total) * 100);
            const isLow = percentage < 30;
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span
                    className={`text-sm ${isLow ? "text-red-600" : "text-slate-600"}`}
                  >
                    {item.available}/{item.total}
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
      </CardContent>
    </Card>
  );
}

export function DeptDashboard({ user }: DeptDashboardProps) {
  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="דשבורד מחלקה - ניהול מלאי ובקשות"
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
                <div
                  key={i}
                  className="h-32 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <DeptStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <PendingRequests />
          </Suspense>

          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
              }
            >
              <ActiveLoans />
            </Suspense>

            <Suspense
              fallback={
                <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
              }
            >
              <InventorySummary />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

