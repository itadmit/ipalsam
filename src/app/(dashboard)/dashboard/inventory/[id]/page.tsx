import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Package,
  Edit,
  ArrowRight,
  Plus,
  History,
  AlertTriangle,
} from "lucide-react";
import { getStatusColor, getStatusLabel } from "@/lib/utils";

// TODO: Replace with actual DB fetch
async function getItemType(id: string) {
  const items: Record<string, {
    id: string;
    name: string;
    catalogNumber: string;
    category: string;
    department: string;
    type: "serial" | "quantity";
    total: number;
    available: number;
    inUse: number;
    description: string;
    notes: string;
    minimumAlert: number;
    requiresDoubleApproval: boolean;
    maxLoanDays: number | null;
  }> = {
    "1": {
      id: "1",
      name: "מכשיר קשר דגם X",
      catalogNumber: "K-2341",
      category: "מכשירי קשר",
      department: "קשר",
      type: "serial",
      total: 60,
      available: 45,
      inUse: 15,
      description: "מכשיר קשר נייד לשימוש צבאי",
      notes: "יש לטעון לפני שימוש",
      minimumAlert: 10,
      requiresDoubleApproval: false,
      maxLoanDays: 7,
    },
  };
  return items[id] || null;
}

async function getSerialUnits(itemTypeId: string) {
  // TODO: Fetch from DB
  return [
    { id: "1", serialNumber: "K-2341-001", status: "available", holder: null },
    { id: "2", serialNumber: "K-2341-002", status: "available", holder: null },
    { id: "3", serialNumber: "K-2341-003", status: "in_use", holder: "יוסי כהן" },
    { id: "4", serialNumber: "K-2341-004", status: "in_use", holder: "דנה לוי" },
    { id: "5", serialNumber: "K-2341-005", status: "maintenance", holder: null },
  ];
}

async function getRecentMovements(itemTypeId: string) {
  // TODO: Fetch from DB
  return [
    { id: "1", type: "allocation", user: "יוסי כהן", quantity: 1, date: "22/01/2026 09:30" },
    { id: "2", type: "return", user: "דנה לוי", quantity: 1, date: "21/01/2026 16:00" },
    { id: "3", type: "intake", user: "ולרי כהן", quantity: 5, date: "20/01/2026 10:00" },
  ];
}

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const item = await getItemType(id);

  if (!item) {
    notFound();
  }

  const units = item.type === "serial" ? await getSerialUnits(id) : [];
  const movements = await getRecentMovements(id);

  const availablePercent = Math.round((item.available / item.total) * 100);
  const isLow = item.available <= item.minimumAlert;

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`מק״ט: ${item.catalogNumber} • ${item.department} • ${item.category}`}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </Button>
            </Link>
            <Link href={`/dashboard/inventory/${id}/edit`}>
              <Button>
                <Edit className="w-4 h-4" />
                ערוך
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">{item.total}</p>
                <p className="text-sm text-slate-500">סה״כ</p>
              </CardContent>
            </Card>
            <Card className={isLow ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>
                  {item.available}
                </p>
                <p className="text-sm text-slate-500">זמין</p>
                {isLow && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-xs">מלאי נמוך!</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{item.inUse}</p>
                <p className="text-sm text-slate-500">בשימוש</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">זמינות</span>
                <span className="text-sm text-slate-500">{availablePercent}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isLow ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${availablePercent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Serial Units Table */}
          {item.type === "serial" && units.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>יחידות סריאליות</CardTitle>
                <Link href={`/dashboard/inventory/${id}/add-unit`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    הוסף יחידה
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>מספר סידורי</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>מחזיק</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                            {unit.serialNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(unit.status)}>
                            {getStatusLabel(unit.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{unit.holder || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                תנועות אחרונות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={movement.type === "intake" ? "success" : movement.type === "return" ? "info" : "warning"}>
                        {movement.type === "intake" ? "קליטה" : movement.type === "return" ? "החזרה" : "הקצאה"}
                      </Badge>
                      <span className="text-sm">{movement.user}</span>
                      {movement.quantity > 1 && (
                        <span className="text-sm text-slate-500">({movement.quantity} יח')</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">{movement.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                פרטי הפריט
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">סוג</p>
                <Badge variant="secondary">
                  {item.type === "serial" ? "סריאלי" : "כמותי"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">תיאור</p>
                <p className="text-sm">{item.description || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">הערות</p>
                <p className="text-sm">{item.notes || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">התראת מלאי נמוך</p>
                <p className="text-sm">{item.minimumAlert} יח'</p>
              </div>
              {item.maxLoanDays && (
                <div>
                  <p className="text-sm text-slate-500">מקס' ימי השאלה</p>
                  <p className="text-sm">{item.maxLoanDays} ימים</p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">דורש אישור כפול</p>
                <Badge variant={item.requiresDoubleApproval ? "warning" : "secondary"}>
                  {item.requiresDoubleApproval ? "כן" : "לא"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/inventory/intake?item=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4" />
                  קליטת יחידות
                </Button>
              </Link>
              <Link href={`/dashboard/handover?item=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4" />
                  מסירה/החזרה
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

