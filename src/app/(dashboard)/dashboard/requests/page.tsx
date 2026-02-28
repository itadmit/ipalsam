import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SearchBar } from "@/components/layout/search-bar";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, FileText, Eye } from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc, or, and } from "drizzle-orm";
import type { SessionUser } from "@/types";

interface SearchParams {
  q?: string;
  status?: string;
  page?: string;
}

async function RequestsTable({ searchParams, user }: { searchParams: SearchParams; user: SessionUser }) {
  // Build query based on user role
  let allRequests = await db.query.requests.findMany({
    with: {
      requester: true,
      itemType: true,
      department: true,
    },
    orderBy: (requests, { desc }) => [desc(requests.createdAt)],
  });

  // Filter based on user role
  if (user.role === "soldier") {
    allRequests = allRequests.filter((r) => r.requesterId === user.id);
  } else if (user.role === "dept_commander" && user.departmentId) {
    allRequests = allRequests.filter((r) => r.departmentId === user.departmentId);
  }

  // Filter by search (חייל מבקש = recipientName)
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    allRequests = allRequests.filter(
      (r) =>
        r.itemType?.name?.toLowerCase().includes(query) ||
        (r.recipientName || "").toLowerCase().includes(query) ||
        (r.recipientPhone || "").includes(query)
    );
  }

  // Filter by status
  if (searchParams.status) {
    allRequests = allRequests.filter((r) => r.status === searchParams.status);
  }

  // Group by requestGroupId (אותה השאלה = בקשה אחת)
  const groupKey = (r: (typeof allRequests)[0]) => r.requestGroupId ?? r.id;
  const grouped = new Map<string, (typeof allRequests)[0][]>();
  for (const r of allRequests) {
    const key = groupKey(r);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const displayGroups = Array.from(grouped.entries()).map(([key, reqs]) => ({
    groupKey: key,
    requests: reqs,
    first: reqs[0],
  }));

  if (displayGroups.length === 0) {
    return (
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
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>חייל מבקש</TableHead>
            <TableHead>פריטים</TableHead>
            <TableHead>מחלקה</TableHead>
            <TableHead>דחיפות</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>תאריך</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayGroups.map(({ groupKey, requests: reqs, first }) => (
            <TableRow key={groupKey}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {(first.recipientName || (first.requester ? `${first.requester.firstName || ""} ${first.requester.lastName || ""}`.trim() : "")) || "-"}
                  </p>
                  <p className="text-sm text-slate-500" dir="ltr">
                    {first.recipientPhone || first.requester?.phone || "-"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {reqs.map((r) => (
                    <p key={r.id} className="text-sm">
                      {r.itemType?.name}
                      {r.quantity > 1 && ` (${r.quantity} יח')`}
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>{first.department?.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={first.urgency === "immediate" ? "destructive" : "info"}>
                  {first.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(first.status)}>
                  {getStatusLabel(first.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {formatDateTime(first.createdAt)}
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/requests/${first.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי חייל מבקש או פריט..."
              className="sm:w-80"
            />
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
