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
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

async function getAuditLogs() {
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit: 100,
    with: {
      user: { columns: { firstName: true, lastName: true } },
    },
  });

  return logs.map((log) => {
    const nv = log.newValues as Record<string, unknown> | null;
    let details = log.action;
    if (log.entityType === "request" && log.entityId)
      details = `השאלה #${String(log.entityId).slice(0, 8)}`;
    else if (log.entityType === "user" && nv?.firstName)
      details = `משתמש ${nv.firstName} ${nv.lastName || ""}`;
    return {
      id: log.id,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : "מערכת",
      action: log.action,
      entityType: log.entityType,
      details,
      createdAt: log.createdAt,
      ip: log.ipAddress,
    };
  });
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

