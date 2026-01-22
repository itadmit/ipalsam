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
import {
  Plus,
  FileText,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface SearchParams {
  q?: string;
  status?: string;
  urgency?: string;
  page?: string;
}

async function RequestsTable({
  searchParams,
  userRole,
}: {
  searchParams: SearchParams;
  userRole: SessionUser["role"];
}) {
  // TODO: Fetch from database with filters
  const requests = [
    {
      id: "1",
      requester: "יוסי כהן",
      phone: "0541234567",
      item: "מכשיר קשר",
      quantity: 1,
      department: "קשר",
      urgency: "immediate",
      status: "submitted",
      createdAt: new Date("2026-01-22T09:30:00"),
    },
    {
      id: "2",
      requester: "דנה לוי",
      phone: "0529876543",
      item: "אנטנה VHF",
      quantity: 2,
      department: "קשר",
      urgency: "scheduled",
      status: "approved",
      createdAt: new Date("2026-01-21T14:15:00"),
    },
    {
      id: "3",
      requester: "אבי מזרחי",
      phone: "0501112233",
      item: "מחשב נייד",
      quantity: 1,
      department: "לוגיסטיקה",
      urgency: "immediate",
      status: "ready_for_pickup",
      createdAt: new Date("2026-01-21T11:00:00"),
    },
    {
      id: "4",
      requester: "שרה גולן",
      phone: "0523334455",
      item: "סוללות AA",
      quantity: 20,
      department: "אפסנאות",
      urgency: "scheduled",
      status: "handed_over",
      createdAt: new Date("2026-01-20T16:30:00"),
    },
    {
      id: "5",
      requester: "משה ישראלי",
      phone: "0545556677",
      item: "אוזניות טקטיות",
      quantity: 1,
      department: "קשר",
      urgency: "immediate",
      status: "rejected",
      createdAt: new Date("2026-01-20T10:00:00"),
    },
    {
      id: "6",
      requester: "רחל אברהם",
      phone: "0507778899",
      item: "מטען",
      quantity: 3,
      department: "קשר",
      urgency: "scheduled",
      status: "returned",
      createdAt: new Date("2026-01-19T15:45:00"),
    },
  ];

  // Filter based on search
  let filteredRequests = requests;
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    filteredRequests = requests.filter(
      (req) =>
        req.requester.toLowerCase().includes(query) ||
        req.item.toLowerCase().includes(query)
    );
  }

  if (searchParams.status) {
    filteredRequests = filteredRequests.filter(
      (req) => req.status === searchParams.status
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="לא נמצאו בקשות"
        description="נסה לשנות את מילות החיפוש או הפילטרים"
        action={
          userRole === "soldier" ? (
            <Link href="/dashboard/requests/new">
              <Button>
                <Plus className="w-4 h-4" />
                בקשה חדשה
              </Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  const canApprove =
    userRole === "super_admin" ||
    userRole === "hq_commander" ||
    userRole === "dept_commander";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>מבקש</TableHead>
            <TableHead>פריט</TableHead>
            <TableHead>מחלקה</TableHead>
            <TableHead>דחיפות</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>תאריך</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{request.requester}</p>
                  <p className="text-sm text-slate-500" dir="ltr">
                    {request.phone}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{request.item}</p>
                {request.quantity > 1 && (
                  <p className="text-sm text-slate-500">
                    {request.quantity} יח&apos;
                  </p>
                )}
              </TableCell>
              <TableCell>{request.department}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.urgency === "immediate" ? "destructive" : "info"
                  }
                >
                  {request.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {formatDateTime(request.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/requests/${request.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  {canApprove && request.status === "submitted" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
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
  const isSoldier = session.user.role === "soldier";

  return (
    <div>
      <PageHeader
        title="בקשות"
        description={isSoldier ? "הבקשות שלי" : "ניהול בקשות הציוד"}
        actions={
          isSoldier && (
            <Link href="/dashboard/requests/new">
              <Button>
                <Plus className="w-4 h-4" />
                בקשה חדשה
              </Button>
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar
              placeholder="חיפוש לפי מבקש או פריט..."
              className="sm:w-80"
            />
            <Button variant="outline">
              <Filter className="w-4 h-4" />
              סינון
            </Button>
          </div>

          <Suspense
            fallback={
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            }
          >
            <RequestsTable
              searchParams={params}
              userRole={session.user.role as SessionUser["role"]}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

