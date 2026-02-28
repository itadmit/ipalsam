import { Suspense } from "react";
import { auth, canAccessSuperAdmin } from "@/lib/auth";
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
import { Download, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { SessionUser } from "@/types";

async function getAuditLogs() {
  // TODO: Fetch from DB
  return [
    {
      id: "1",
      user: "יוגב אביטן",
      action: "create_user",
      entityType: "user",
      details: 'משתמש חדש "דני לוי" נוצר',
      createdAt: new Date("2026-01-22T09:30:00"),
      ip: "192.168.1.1",
    },
    {
      id: "2",
      user: "ניסם חדד",
      action: "approve_request",
      entityType: "request",
      details: "השאלה #1234 אושרה",
      createdAt: new Date("2026-01-22T09:15:00"),
      ip: "192.168.1.2",
    },
    {
      id: "3",
      user: "ולרי כהן",
      action: "handover_item",
      entityType: "request",
      details: "מכשיר קשר #K-2341 נמסר ליוסי כהן",
      createdAt: new Date("2026-01-22T08:45:00"),
      ip: "192.168.1.3",
    },
    {
      id: "4",
      user: "מערכת",
      action: "alert",
      entityType: "system",
      details: "התראה: מלאי נמוך - סוללות AA",
      createdAt: new Date("2026-01-22T08:00:00"),
      ip: null,
    },
    {
      id: "5",
      user: "דני לוי",
      action: "return_item",
      entityType: "request",
      details: "רובה #W-1000-015 הוחזר",
      createdAt: new Date("2026-01-21T17:30:00"),
      ip: "192.168.1.4",
    },
    {
      id: "6",
      user: "יוגב אביטן",
      action: "update_department",
      entityType: "department",
      details: 'שעות פעילות מחלקת "קשר" עודכנו',
      createdAt: new Date("2026-01-21T14:00:00"),
      ip: "192.168.1.1",
    },
    {
      id: "7",
      user: "מיכל אברהם",
      action: "intake_quantity",
      entityType: "item_type",
      details: "קליטת 50 יח' סוללות AA",
      createdAt: new Date("2026-01-21T10:00:00"),
      ip: "192.168.1.5",
    },
  ];
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create_user: "יצירת משתמש",
    update_user: "עדכון משתמש",
    deactivate_user: "השבתת משתמש",
    activate_user: "הפעלת משתמש",
    create_department: "יצירת מחלקה",
    update_department: "עדכון מחלקה",
    create_item_type: "יצירת סוג ציוד",
    update_item_type: "עדכון סוג ציוד",
    add_serial_unit: "הוספת יחידה סריאלית",
    intake_quantity: "קליטת כמות",
    create_request: "יצירת השאלה",
    approve_request: "אישור השאלה",
    reject_request: "דחיית השאלה",
    handover_item: "מסירת ציוד",
    return_item: "החזרת ציוד",
    alert: "התראה",
  };
  return labels[action] || action;
}

function getActionBadgeVariant(action: string) {
  if (action.includes("create")) return "success";
  if (action.includes("update")) return "info";
  if (action.includes("delete") || action.includes("deactivate")) return "destructive";
  if (action.includes("approve")) return "success";
  if (action.includes("reject")) return "destructive";
  if (action === "alert") return "warning";
  return "secondary";
}

export default async function AuditLogPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const logs = await getAuditLogs();

  return (
    <div>
      <PageHeader
        title="יומן פעילות"
        description="היסטוריית כל הפעולות במערכת"
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4" />
            ייצוא
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי משתמש או פעולה..."
              className="sm:w-80"
            />
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              סינון
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>תאריך</TableHead>
                  <TableHead>משתמש</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>פרטים</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-slate-500">
                        {log.ip || "-"}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

