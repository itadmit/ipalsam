import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBar } from "@/components/layout/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, FileText } from "lucide-react";
import { RequestList } from "./request-list";
import { RequestsFilters } from "./requests-filters";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc, and, gte, count } from "drizzle-orm";
import type { SessionUser } from "@/types";

const PAGE_SIZE = 15;

interface SearchParams {
  q?: string;
  status?: string;
  sort?: string;
  page?: string;
}

async function RequestsStats({ user }: { user: SessionUser }) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthConditions = [gte(requests.createdAt, startOfMonth)];
  const pendingConditions = [eq(requests.status, "submitted")];
  if (user.role === "soldier") {
    monthConditions.push(eq(requests.requesterId, user.id));
    pendingConditions.push(eq(requests.requesterId, user.id));
  } else if (user.role === "dept_commander" && user.departmentId) {
    monthConditions.push(eq(requests.departmentId, user.departmentId));
    pendingConditions.push(eq(requests.departmentId, user.departmentId));
  }

  const [monthCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(...monthConditions));

  const [pendingCount] = await db
    .select({ count: count() })
    .from(requests)
    .where(and(...pendingConditions));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">בקשות החודש</p>
          <p className="text-2xl font-bold text-slate-900">{monthCount?.count ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-slate-500">ממתינות לאישור</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount?.count ?? 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RequestsTable({ searchParams, user }: { searchParams: SearchParams; user: SessionUser }) {
  let allRequests = await db.query.requests.findMany({
    with: {
      requester: true,
      itemType: true,
      department: true,
    },
    orderBy: [desc(requests.createdAt)],
  });

  if (user.role === "soldier") {
    allRequests = allRequests.filter((r) => r.requesterId === user.id);
  } else if (user.role === "dept_commander" && user.departmentId) {
    allRequests = allRequests.filter((r) => r.departmentId === user.departmentId);
  }

  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    allRequests = allRequests.filter(
      (r) =>
        r.itemType?.name?.toLowerCase().includes(query) ||
        (r.recipientName || "").toLowerCase().includes(query) ||
        (r.recipientPhone || "").includes(query)
    );
  }

  if (searchParams.status === "submitted") {
    allRequests = allRequests.filter((r) => r.status === "submitted");
  } else if (searchParams.status === "processed") {
    allRequests = allRequests.filter((r) =>
      ["approved", "ready_for_pickup", "handed_over", "returned", "closed"].includes(r.status)
    );
  } else if (searchParams.status === "rejected") {
    allRequests = allRequests.filter((r) => r.status === "rejected");
  }

  const sort = searchParams.sort || "date_desc";
  if (sort === "date_asc") {
    allRequests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else if (sort === "item_asc") {
    allRequests.sort((a, b) => (a.itemType?.name || "").localeCompare(b.itemType?.name || ""));
  } else if (sort === "item_desc") {
    allRequests.sort((a, b) => (b.itemType?.name || "").localeCompare(a.itemType?.name || ""));
  }

  const groupKey = (r: (typeof allRequests)[0]) => r.requestGroupId ?? r.id;
  const grouped = new Map<string, (typeof allRequests)[0][]>();
  for (const r of allRequests) {
    const key = groupKey(r);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const allGroups = Array.from(grouped.entries()).map(([key, reqs]) => ({
    groupKey: key,
    requests: reqs,
    first: reqs[0],
  }));

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const totalPages = Math.ceil(allGroups.length / PAGE_SIZE);
  const displayGroups = allGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (displayGroups.length === 0) {
    return (
      <>
        <RequestsStats user={user} />
        <EmptyState
          icon={FileText}
          title="אין השאלות"
          description={user.role === "soldier" ? "עדיין לא הגשת השאלות" : "אין השאלות במערכת"}
          action={
            <Link href="/dashboard/requests/new">
              <Button>
                <Plus className="w-4 h-4" />
                השאלה חדשה
              </Button>
            </Link>
          }
        />
      </>
    );
  }

  const listData = displayGroups.map(({ groupKey, requests: reqs, first }) => ({
    groupKey,
    firstId: first.id,
    recipientName:
      (first.recipientName ||
        (first.requester
          ? `${first.requester.firstName || ""} ${first.requester.lastName || ""}`.trim()
          : "")) || "-",
    recipientPhone: first.recipientPhone || first.requester?.phone || "-",
    reqs,
    departmentName: first.department?.name || "-",
    urgency: first.urgency,
    status: first.status,
    createdAt: first.createdAt,
  }));

  return (
    <>
      <RequestsStats user={user} />
      <RequestList groups={listData} totalPages={totalPages} currentPage={page} totalCount={allGroups.length} pageSize={PAGE_SIZE} />
    </>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="השאלות"
        description="ניהול השאלות לציוד"
        actions={
          <Link href="/dashboard/requests/new">
            <Button>
              <Plus className="w-4 h-4" />
              השאלה חדשה
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-4 max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row gap-4 mb-6 flex-wrap">
            <SearchBar
              placeholder="חיפוש לפי חייל מבקש או פריט..."
              className="sm:w-80"
            />
            <RequestsFilters />
          </div>

          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            }
          >
            <RequestsTable searchParams={params} user={session.user as SessionUser} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
