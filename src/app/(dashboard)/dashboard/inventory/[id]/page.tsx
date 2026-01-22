import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Package,
  Edit,
  ArrowRight,
  Plus,
  History,
  AlertTriangle,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import { db } from "@/db";
import { itemTypes, itemUnits, movements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const item = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, id),
    with: {
      department: true,
      category: true,
    },
  });

  if (!item) {
    notFound();
  }

  // Get serial units if serial type
  const units = item.type === "serial"
    ? await db.query.itemUnits.findMany({
        where: eq(itemUnits.itemTypeId, id),
        with: {
          currentHolder: true,
        },
      })
    : [];

  // Get recent movements
  const recentMovements = await db.query.movements.findMany({
    where: eq(movements.itemTypeId, id),
    limit: 10,
    orderBy: [desc(movements.createdAt)],
    with: {
      executedBy: true,
    },
  });

  const total = item.quantityTotal || 0;
  const available = item.quantityAvailable || 0;
  const inUse = item.quantityInUse || 0;
  const availablePercent = total > 0 ? Math.round((available / total) * 100) : 0;
  const isLow = available <= (item.minimumAlert || 0);

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`מק״ט: ${item.catalogNumber || "-"} • ${item.department?.name || "-"} • ${item.category?.name || "-"}`}
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
                <p className="text-3xl font-bold text-slate-900">{total}</p>
                <p className="text-sm text-slate-500">סה״כ</p>
              </CardContent>
            </Card>
            <Card className={isLow ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>
                  {available}
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
                <p className="text-3xl font-bold text-blue-600">{inUse}</p>
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
          {item.type === "serial" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>יחידות סריאליות</CardTitle>
                <Link href={`/dashboard/inventory/intake?itemTypeId=${id}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    הוסף יחידה
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {units.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="אין יחידות"
                    description="הוסף יחידות סריאליות לפריט זה"
                    action={
                      <Link href={`/dashboard/inventory/intake?itemTypeId=${id}`}>
                        <Button>
                          <Plus className="w-4 h-4" />
                          הוסף יחידה
                        </Button>
                      </Link>
                    }
                  />
                ) : (
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
                          <TableCell>
                            {unit.currentHolder
                              ? `${unit.currentHolder.firstName} ${unit.currentHolder.lastName}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
              {recentMovements.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="אין תנועות"
                  description="עדיין לא בוצעו תנועות בפריט זה"
                />
              ) : (
                <div className="space-y-3">
                  {recentMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          movement.type === "intake" ? "success" :
                          movement.type === "return" ? "info" : "warning"
                        }>
                          {movement.type === "intake" ? "קליטה" :
                           movement.type === "return" ? "החזרה" :
                           movement.type === "allocation" ? "הקצאה" : movement.type}
                        </Badge>
                        <span className="text-sm">
                          {movement.executedBy
                            ? `${movement.executedBy.firstName} ${movement.executedBy.lastName}`
                            : "-"}
                        </span>
                        {movement.quantity > 1 && (
                          <span className="text-sm text-slate-500">({movement.quantity} יח&apos;)</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">{formatDateTime(movement.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
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
                <p className="text-sm">{item.minimumAlert} יח&apos;</p>
              </div>
              {item.maxLoanDays && (
                <div>
                  <p className="text-sm text-slate-500">מקס&apos; ימי השאלה</p>
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
              <Link href={`/dashboard/inventory/intake?itemTypeId=${id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4" />
                  קליטת יחידות
                </Button>
              </Link>
              <Link href={`/dashboard/handover`} className="block">
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
