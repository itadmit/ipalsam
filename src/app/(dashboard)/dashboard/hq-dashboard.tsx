import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Package,
  FileText,
  AlertTriangle,
  Clock,
  Plus,
  ArrowLeft,
} from "lucide-react";
import type { SessionUser } from "@/types";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface HQDashboardProps {
  user: SessionUser;
}

// Server component - fetches data
async function DashboardStats() {
  // TODO: Replace with actual data from database
  const stats = {
    totalDepartments: 6,
    totalItems: 1250,
    availableItems: 980,
    inUseItems: 245,
    pendingRequests: 12,
    overdueItems: 3,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="מחלקות פעילות"
        value={stats.totalDepartments}
        icon={Building2}
        description="6 מחלקות בבסיס"
      />
      <StatCard
        title="סה״כ פריטים"
        value={stats.totalItems.toLocaleString()}
        icon={Package}
        iconClassName="bg-blue-50"
      />
      <StatCard
        title="בקשות ממתינות"
        value={stats.pendingRequests}
        icon={FileText}
        iconClassName="bg-amber-50"
      />
      <StatCard
        title="פריטים באיחור"
        value={stats.overdueItems}
        icon={AlertTriangle}
        iconClassName="bg-red-50"
      />
    </div>
  );
}

async function DepartmentOverview() {
  // TODO: Replace with actual data
  const departments = [
    { id: "1", name: "קשר", available: 120, inUse: 45, pending: 3, overdue: 0 },
    { id: "2", name: "נשק", available: 85, inUse: 60, pending: 5, overdue: 1 },
    {
      id: "3",
      name: "לוגיסטיקה",
      available: 200,
      inUse: 30,
      pending: 2,
      overdue: 0,
    },
    {
      id: "4",
      name: "אפסנאות",
      available: 340,
      inUse: 80,
      pending: 1,
      overdue: 2,
    },
    { id: "5", name: "רכב", available: 45, inUse: 15, pending: 1, overdue: 0 },
    {
      id: "6",
      name: "שלישות",
      available: 190,
      inUse: 15,
      pending: 0,
      overdue: 0,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>סטטוס מחלקות</CardTitle>
        <Link href="/dashboard/departments">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{dept.name}</p>
                  <p className="text-sm text-slate-500">
                    {dept.available + dept.inUse} פריטים
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">
                    {dept.available}
                  </p>
                  <p className="text-xs text-slate-500">זמין</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-600">
                    {dept.inUse}
                  </p>
                  <p className="text-xs text-slate-500">בשימוש</p>
                </div>
                {dept.pending > 0 && (
                  <Badge variant="warning">{dept.pending} ממתין</Badge>
                )}
                {dept.overdue > 0 && (
                  <Badge variant="destructive">{dept.overdue} באיחור</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function RecentRequests() {
  // TODO: Replace with actual data
  const requests = [
    {
      id: "1",
      requester: "יוסי כהן",
      item: "מכשיר קשר",
      department: "קשר",
      status: "submitted",
      time: "לפני 5 דקות",
    },
    {
      id: "2",
      requester: "דנה לוי",
      item: 'רובה M16 (3 יח")',
      department: "נשק",
      status: "approved",
      time: "לפני 15 דקות",
    },
    {
      id: "3",
      requester: "אבי מזרחי",
      item: "מחשב נייד",
      department: "לוגיסטיקה",
      status: "ready_for_pickup",
      time: "לפני 30 דקות",
    },
    {
      id: "4",
      requester: "שרה גולן",
      item: 'סוללות (20 יח")',
      department: "אפסנאות",
      status: "handed_over",
      time: "לפני שעה",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>בקשות אחרונות</CardTitle>
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="sm">
            הצג הכל
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {request.item}
                  </p>
                  <p className="text-xs text-slate-500">
                    {request.requester} • {request.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{request.time}</span>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function CriticalAlerts() {
  // TODO: Replace with actual data
  const alerts = [
    {
      id: "1",
      type: "overdue",
      message: 'מכשיר קשר #K-2341 באיחור של 3 ימים',
      holder: "משה ישראלי",
      department: "קשר",
    },
    {
      id: "2",
      type: "low_stock",
      message: 'מלאי סוללות AA נמוך (5 יח")',
      department: "אפסנאות",
    },
    {
      id: "3",
      type: "overdue",
      message: 'מחשב נייד #L-1122 באיחור של יום',
      holder: "רותי כהן",
      department: "לוגיסטיקה",
    },
  ];

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          חריגים דורשי טיפול
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-red-100"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                {alert.type === "overdue" ? (
                  <Clock className="w-4 h-4 text-red-600" />
                ) : (
                  <Package className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {alert.message}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {alert.holder && `${alert.holder} • `}
                  {alert.department}
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0">
                טפל
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function HQDashboard({ user }: HQDashboardProps) {
  return (
    <div>
      <PageHeader
        title={`שלום, ${user.firstName}`}
        description="דשבורד מפקדה - תמונת מצב כללית"
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/new">
              <Button>
                <Plus className="w-4 h-4" />
                הוסף ציוד
              </Button>
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
          <DashboardStats />
        </Suspense>

        <Suspense
          fallback={
            <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <CriticalAlerts />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <DepartmentOverview />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
            }
          >
            <RecentRequests />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

