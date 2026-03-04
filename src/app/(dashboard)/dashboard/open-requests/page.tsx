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
  users,
} from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { OpenRequestItemsTable } from "./open-request-items-table";
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
  const urlStatusFilter = params.status || "";
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // טעינת הרשאות המשתמש – פילטר בקשות פתוחות
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { visibleFeatures: true },
  });
  const visibleFeatures = (userRow?.visibleFeatures ?? {}) as Record<string, unknown>;
  const userOpenRequestsFilter = visibleFeatures["open-requests-filter"] as string | undefined;
  const effectiveStatusFilter =
    userOpenRequestsFilter === "processed_only"
      ? "processed"
      : userOpenRequestsFilter === "pending_only"
        ? "pending"
        : urlStatusFilter;
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

  // סינון לפי סטטוס (הרשאה מהמשתמש או מ-URL)
  if (effectiveStatusFilter === "pending") {
    allRequests = allRequests.filter((r) => r.items.some((i) => i.status === "pending"));
  } else if (effectiveStatusFilter === "processed") {
    allRequests = allRequests.filter((r) =>
      r.items.every((i) => ["approved", "rejected", "deleted"].includes(i.status)) &&
      r.items.some((i) => i.status !== "deleted") // יש לפחות פריט אחד שמוצג (לא נמחק)
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
        <OpenRequestsToolbar
          userFilter={userOpenRequestsFilter as "all" | "pending_only" | "processed_only" | undefined}
          effectiveStatus={effectiveStatusFilter}
        />
      </div>

      <div className="space-y-6">
        {sortedRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              {effectiveStatusFilter === "pending"
                ? "אין בקשות ממתינות"
                : effectiveStatusFilter === "processed"
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
                <OpenRequestItemsTable items={req.items.filter((i) => i.status !== "deleted")} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
