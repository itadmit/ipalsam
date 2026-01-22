import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Building2,
  Users,
  Package,
  FileText,
  Settings,
  Clock,
} from "lucide-react";

async function DepartmentsList() {
  // TODO: Fetch from database
  const departments = [
    {
      id: "1",
      name: "קשר",
      description: "ציוד תקשורת ומכשירי קשר",
      commander: "ולרי כהן",
      commanderPhone: "0541234567",
      operatingHours: "08:00-17:00",
      allowImmediate: true,
      itemCount: 165,
      availableCount: 120,
      userCount: 8,
      pendingRequests: 3,
    },
    {
      id: "2",
      name: "נשק",
      description: "ניהול נשק ותחמושת",
      commander: "דני לוי",
      commanderPhone: "0529876543",
      operatingHours: "07:00-19:00",
      allowImmediate: false,
      itemCount: 145,
      availableCount: 85,
      userCount: 5,
      pendingRequests: 5,
    },
    {
      id: "3",
      name: "לוגיסטיקה",
      description: "ציוד מחשוב ותקשוב",
      commander: "מיכל אברהם",
      commanderPhone: "0501112233",
      operatingHours: "08:00-16:00",
      allowImmediate: true,
      itemCount: 230,
      availableCount: 200,
      userCount: 6,
      pendingRequests: 2,
    },
    {
      id: "4",
      name: "אפסנאות",
      description: "אספקה כללית וחומרים מתכלים",
      commander: "יוסי מזרחי",
      commanderPhone: "0523334455",
      operatingHours: "08:00-14:00",
      allowImmediate: true,
      itemCount: 420,
      availableCount: 340,
      userCount: 4,
      pendingRequests: 1,
    },
    {
      id: "5",
      name: "רכב",
      description: "ניהול כלי רכב ותחזוקה",
      commander: "עמית גולן",
      commanderPhone: "0545556677",
      operatingHours: "06:00-22:00",
      allowImmediate: true,
      itemCount: 60,
      availableCount: 45,
      userCount: 3,
      pendingRequests: 1,
    },
    {
      id: "6",
      name: "שלישות",
      description: "ציוד משרדי וריהוט",
      commander: "נועה ישראלי",
      commanderPhone: "0507778899",
      operatingHours: "08:00-17:00",
      allowImmediate: true,
      itemCount: 205,
      availableCount: 190,
      userCount: 2,
      pendingRequests: 0,
    },
  ];

  if (departments.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="אין מחלקות"
        description="לא נמצאו מחלקות במערכת"
        action={
          <Link href="/super-admin/departments/new">
            <Button>
              <Plus className="w-4 h-4" />
              הוסף מחלקה
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {departments.map((dept) => (
        <Card key={dept.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-slate-500">{dept.description}</p>
                </div>
              </div>
              <Link href={`/dashboard/departments/${dept.id}/settings`}>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">מפקד:</span>
                <span className="font-medium">{dept.commander}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">שעות פעילות:</span>
                <span className="font-medium" dir="ltr">
                  {dept.operatingHours}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={dept.allowImmediate ? "success" : "secondary"}>
                  {dept.allowImmediate ? "מאפשר מיידי" : "מראש בלבד"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                  <Package className="w-4 h-4" />
                  פריטים
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {dept.itemCount}
                </p>
                <p className="text-xs text-green-600">
                  {dept.availableCount} זמינים
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  משתמשים
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {dept.userCount}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {dept.pendingRequests > 0 ? (
                <Badge variant="warning">
                  <FileText className="w-3 h-3 ml-1" />
                  {dept.pendingRequests} בקשות ממתינות
                </Badge>
              ) : (
                <Badge variant="success">אין בקשות ממתינות</Badge>
              )}
              <Link href={`/dashboard/departments/${dept.id}`}>
                <Button variant="outline" size="sm">
                  צפה
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canCreate =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander";

  return (
    <div>
      <PageHeader
        title="מחלקות"
        description="ניהול מחלקות הבסיס"
        actions={
          canCreate && (
            <Link href="/super-admin/departments/new">
              <Button>
                <Plus className="w-4 h-4" />
                מחלקה חדשה
              </Button>
            </Link>
          )
        }
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <DepartmentsList />
      </Suspense>
    </div>
  );
}

