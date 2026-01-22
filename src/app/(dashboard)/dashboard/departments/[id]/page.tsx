import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
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
  Clock,
} from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

// TODO: Replace with actual DB fetch
async function getDepartment(id: string) {
  const departments: Record<string, {
    id: string;
    name: string;
    description: string;
    commander: string;
    commanderPhone: string;
    operatingHoursStart: string;
    operatingHoursEnd: string;
    allowImmediate: boolean;
    allowScheduled: boolean;
    stats: {
      totalItems: number;
      availableItems: number;
      inUseItems: number;
      pendingRequests: number;
      activeUsers: number;
    };
  }> = {
    "1": {
      id: "1",
      name: "קשר",
      description: "ציוד תקשורת ומכשירי קשר",
      commander: "ולרי כהן",
      commanderPhone: "0541234567",
      operatingHoursStart: "08:00",
      operatingHoursEnd: "17:00",
      allowImmediate: true,
      allowScheduled: true,
      stats: {
        totalItems: 165,
        availableItems: 120,
        inUseItems: 45,
        pendingRequests: 3,
        activeUsers: 8,
      },
    },
  };
  return departments[id] || null;
}

async function getDepartmentItems(deptId: string) {
  // TODO: Fetch from DB
  return [
    { id: "1", name: "מכשיר קשר דגם X", catalogNumber: "K-2341", total: 60, available: 45 },
    { id: "2", name: "אנטנה VHF", catalogNumber: "A-1122", total: 40, available: 32 },
    { id: "3", name: "אוזניות טקטיות", catalogNumber: "H-3300", total: 25, available: 18 },
    { id: "4", name: "מטען למכשיר קשר", catalogNumber: "C-4400", total: 30, available: 28 },
  ];
}

async function getRecentRequests(deptId: string) {
  // TODO: Fetch from DB
  return [
    { id: "1", requester: "יוסי כהן", item: "מכשיר קשר", status: "submitted", date: "22/01/2026" },
    { id: "2", requester: "דנה לוי", item: "אנטנה", status: "approved", date: "21/01/2026" },
  ];
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const department = await getDepartment(id);

  if (!department) {
    notFound();
  }

  const items = await getDepartmentItems(id);
  const requests = await getRecentRequests(id);

  const canManage =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    (session.user.role === "dept_commander" && session.user.departmentId === id);

  return (
    <div>
      <PageHeader
        title={department.name}
        description={department.description}
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
            value={department.stats.totalItems}
            icon={Package}
          />
          <StatCard
            title="זמינים"
            value={department.stats.availableItems}
            icon={Package}
            iconClassName="bg-green-50"
          />
          <StatCard
            title="בשימוש"
            value={department.stats.inUseItems}
            icon={Package}
            iconClassName="bg-blue-50"
          />
          <StatCard
            title="בקשות ממתינות"
            value={department.stats.pendingRequests}
            icon={FileText}
            iconClassName="bg-amber-50"
          />
          <StatCard
            title="משתמשים"
            value={department.stats.activeUsers}
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
                <p className="text-sm text-slate-500">מפקד</p>
                <p className="font-medium">{department.commander}</p>
                <p className="text-sm text-slate-500" dir="ltr">{department.commanderPhone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">שעות פעילות</p>
                <p className="font-medium" dir="ltr">
                  {department.operatingHoursStart} - {department.operatingHoursEnd}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">סוגי בקשות</p>
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
                        <p className="text-xs text-slate-500">{item.catalogNumber}</p>
                      </TableCell>
                      <TableCell className="text-center font-medium text-green-600">
                        {item.available}
                      </TableCell>
                      <TableCell className="text-center">{item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                בקשות אחרונות
              </CardTitle>
              <Link href={`/dashboard/requests?dept=${id}`}>
                <Button variant="ghost" size="sm">
                  הצג הכל
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/dashboard/requests/${req.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{req.requester}</p>
                      <p className="text-sm text-slate-500">{req.item}</p>
                    </div>
                    <div className="text-left">
                      <Badge className={getStatusColor(req.status)}>
                        {getStatusLabel(req.status)}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{req.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

