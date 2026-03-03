import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import {
  openRequests,
  handoverDepartments,
  departments,
} from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { OpenRequestItemActions } from "./open-request-item-actions";
import { OpenRequestDeleteButton } from "./open-request-delete-button";
import { OpenRequestsToolbar } from "./open-requests-toolbar";
import { OpenRequestsExportButton } from "./open-requests-export-button";
import { User, Store, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface SearchParams {
  sort?: string;
  status?: string;
}

export default async function OpenRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sort = params.sort || "date_desc";
  const statusFilter = params.status || "";
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;
  const userDeptId = session.user.departmentId;

  const isSuperAdmin = role === "super_admin";
  const isHQ = role === "hq_commander";
  const isDeptCommander = role === "dept_commander";

  let departmentIds: string[] = [];
  if (isSuperAdmin || isHQ) {
    const allDepts = await db.query.departments.findMany({
      where: eq(departments.isActive, true),
      columns: { id: true },
    });
    departmentIds = allDepts.map((d) => d.id);
  } else if (isDeptCommander && userDeptId) {
    departmentIds = [userDeptId];
  } else {
    const handover = await db.query.handoverDepartments.findMany({
      where: eq(handoverDepartments.userId, userId),
      columns: { departmentId: true },
    });
    departmentIds = handover.map((h) => h.departmentId);
  }

  if (departmentIds.length === 0) {
    return (
      <div>
        <PageHeader title="בקשות פתוחות" description="אין גישה" />
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            אין לך הרשאה לצפות בבקשות פתוחות
          </CardContent>
        </Card>
      </div>
    );
  }

  const allRequestsRaw = await db.query.openRequests.findMany({
    where: inArray(openRequests.departmentId, departmentIds),
    orderBy: [desc(openRequests.createdAt)],
    with: {
      requester: { columns: { firstName: true, lastName: true } },
      department: { columns: { name: true } },
      items: {
        orderBy: (items, { asc }) => [asc(items.createdAt)],
      },
    },
  });

  // הפרדה מלאה: בקשות מ-public_store – רק בעל החנות רואה. super_admin רואה הכל. hq_commander לא רואה בקשות של אחרים.
  let allRequests = allRequestsRaw.filter((r) => {
    if (r.source === "public_store") {
      if (r.handoverUserId) {
        return r.handoverUserId === userId || isSuperAdmin;
      }
      return false;
    }
    return true;
  });

  // סינון לפי סטטוס
  if (statusFilter === "pending") {
    allRequests = allRequests.filter((r) => r.items.some((i) => i.status === "pending"));
  } else if (statusFilter === "processed") {
    allRequests = allRequests.filter((r) =>
      r.items.every((i) => i.status === "approved" || i.status === "rejected")
    );
  }

  // מיון
  const sortedRequests = [...allRequests];
  if (sort === "date_asc") {
    sortedRequests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else if (sort === "date_desc") {
    sortedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sort === "dept_asc") {
    sortedRequests.sort((a, b) =>
      (a.department?.name || "").localeCompare(b.department?.name || "")
    );
  } else if (sort === "dept_desc") {
    sortedRequests.sort((a, b) =>
      (b.department?.name || "").localeCompare(a.department?.name || "")
    );
  } else if (sort === "requester_asc") {
    sortedRequests.sort((a, b) => {
      const nameA = a.requester
        ? `${a.requester.firstName} ${a.requester.lastName}`
        : a.requesterName || a.requesterPhone || "";
      const nameB = b.requester
        ? `${b.requester.firstName} ${b.requester.lastName}`
        : b.requesterName || b.requesterPhone || "";
      return nameA.localeCompare(nameB);
    });
  } else if (sort === "requester_desc") {
    sortedRequests.sort((a, b) => {
      const nameA = a.requester
        ? `${a.requester.firstName} ${a.requester.lastName}`
        : a.requesterName || a.requesterPhone || "";
      const nameB = b.requester
        ? `${b.requester.firstName} ${b.requester.lastName}`
        : b.requesterName || b.requesterPhone || "";
      return nameB.localeCompare(nameA);
    });
  } else if (sort === "item_asc") {
    sortedRequests.sort((a, b) => {
      const nameA = a.items[0]?.itemName || "";
      const nameB = b.items[0]?.itemName || "";
      return nameA.localeCompare(nameB);
    });
  } else if (sort === "item_desc") {
    sortedRequests.sort((a, b) => {
      const nameA = a.items[0]?.itemName || "";
      const nameB = b.items[0]?.itemName || "";
      return nameB.localeCompare(nameA);
    });
  }

  return (
    <div>
      <PageHeader
        title="בקשות פתוחות"
        description="בקשות ציוד מהספק – אשר או דחה כל פריט"
        actions={
          <Suspense fallback={null}>
            <OpenRequestsExportButton />
          </Suspense>
        }
      />

      <div className="mb-6">
        <OpenRequestsToolbar />
      </div>

      <div className="space-y-6">
        {sortedRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {statusFilter === "pending"
                ? "אין בקשות ממתינות"
                : statusFilter === "processed"
                  ? "אין בקשות שטופלו"
                  : "אין בקשות"}
            </CardContent>
          </Card>
        ) : (
          sortedRequests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2 flex-wrap flex-1">
                  <User className="w-4 h-4 shrink-0" />
                  {req.requester
                    ? `${req.requester.firstName} ${req.requester.lastName}`
                    : req.requesterName || req.requesterPhone || "מבקש (חנות)"}
                  <Badge
                    variant={req.source === "public_store" ? "secondary" : "outline"}
                    className="text-xs shrink-0"
                  >
                    {req.source === "public_store" ? (
                      <>
                        <Store className="w-3 h-3 ml-1" />
                        בקשה פתוחה
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3 ml-1" />
                        בקשה פתוחה
                      </>
                    )}
                  </Badge>
                  <span className="text-slate-500 font-normal">
                    • {req.department?.name} • {formatDateTime(req.createdAt)}
                  </span>
                </CardTitle>
                <OpenRequestDeleteButton requestId={req.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-right py-2 px-3 font-medium">שם הפריט</th>
                        <th className="text-right py-2 px-3 font-medium">כמות</th>
                        <th className="text-right py-2 px-3 font-medium">הערות</th>
                        <th className="text-right py-2 px-3 font-medium w-32">פעולה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-2 px-3">{item.itemName}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3 text-slate-500">{item.notes || "-"}</td>
                          <td className="py-2 px-3">
                            <OpenRequestItemActions
                              itemId={item.id}
                              status={item.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
