import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Building2,
  ArrowRight,
  Settings,
  Package,
  Users,
  FileText,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import { db } from "@/db";
import { departments, itemTypes, requests } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
    with: {
      users: true,
    },
  });

  if (!department) {
    notFound();
  }

  // Get department items
  const items = await db.query.itemTypes.findMany({
    where: eq(itemTypes.departmentId, id),
    limit: 10,
    orderBy: (itemTypes, { desc }) => [desc(itemTypes.createdAt)],
  });

  // Get department requests
  const recentRequests = await db.query.requests.findMany({
    where: eq(requests.departmentId, id),
    limit: 5,
    orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    with: {
      requester: true,
      itemType: true,
    },
  });

  // Calculate stats
  const totalItems = items.reduce((acc, item) => acc + (item.quantityTotal || 0), 0);
  const availableItems = items.reduce((acc, item) => acc + (item.quantityAvailable || 0), 0);
  const inUseItems = items.reduce((acc, item) => acc + (item.quantityInUse || 0), 0);

  const [pendingRequestCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(eq(requests.departmentId, id), eq(requests.status, "submitted")));

  const canManage =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    (session.user.role === "dept_commander" && session.user.departmentId === id);

  return (
    <div>
      <PageHeader
        title={department.name}
        description={department.description || "מחלקה"}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/departments">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </Button>
            </Link>
            {canManage && (
              <Link href={`/dashboard/departments/${id}/settings`}>
                <Button>
                  <Settings className="w-4 h-4" />
                  הגדרות
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="סה״כ פריטים"
            value={totalItems}
            icon={Package}
          />
          <StatCard
            title="זמינים"
            value={availableItems}
            icon={Package}
            iconClassName="bg-green-50"
          />
          <StatCard
            title="בשימוש"
            value={inUseItems}
            icon={Package}
            iconClassName="bg-blue-50"
          />
          <StatCard
            title="השאלות ממתינות"
            value={pendingRequestCount?.count || 0}
            icon={FileText}
            iconClassName="bg-amber-50"
          />
          <StatCard
            title="משתמשים"
            value={department.users?.length || 0}
            icon={Users}
            iconClassName="bg-purple-50"
          />
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              פרטי המחלקה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500">סטטוס</p>
                <Badge variant={department.isActive ? "success" : "secondary"}>
                  {department.isActive ? "פעילה" : "לא פעילה"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">סוגי השאלות</p>
                <div className="flex gap-2">
                  {department.allowImmediate && (
                    <Badge variant="success">מיידי</Badge>
                  )}
                  {department.allowScheduled && (
                    <Badge variant="info">מתוזמן</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                פריטי מלאי
              </CardTitle>
              <Link href={`/dashboard/inventory?dept=${id}`}>
                <Button variant="ghost" size="sm">
                  הצג הכל
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="אין פריטים"
                  description="לא נמצאו פריטים במחלקה זו"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>פריט</TableHead>
                      <TableHead className="text-center">זמין</TableHead>
                      <TableHead className="text-center">סה״כ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link href={`/dashboard/inventory/${item.id}`} className="hover:underline">
                            {item.name}
                          </Link>
                          <p className="text-xs text-slate-500">{item.catalogNumber || "-"}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium text-green-600">
                          {item.quantityAvailable || 0}
                        </TableCell>
                        <TableCell className="text-center">{item.quantityTotal || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                השאלות אחרונות
              </CardTitle>
              <Link href={`/dashboard/requests?dept=${id}`}>
                <Button variant="ghost" size="sm">
                  הצג הכל
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="אין השאלות"
                  description="לא נמצאו השאלות במחלקה זו"
                />
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((req) => (
                    <Link
                      key={req.id}
                      href={`/dashboard/requests/${req.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {req.recipientName || `${req.requester?.firstName || ""} ${req.requester?.lastName || ""}`.trim() || "-"}
                        </p>
                        <p className="text-sm text-slate-500">{req.itemType?.name}</p>
                      </div>
                      <div className="text-left">
                        <Badge className={getStatusColor(req.status)}>
                          {getStatusLabel(req.status)}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDateTime(req.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
