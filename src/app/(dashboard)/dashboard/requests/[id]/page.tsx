import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Package,
  User,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import { RequestStatusChange } from "./request-status-change";
import { SingleItemReturnButton } from "@/app/(dashboard)/dashboard/handover/group/[groupKey]/return/single-item-return-button";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, id),
    with: {
      requester: true,
      itemType: true,
      department: true,
      approvedBy: true,
      handedOverBy: true,
    },
  });

  if (!request) {
    notFound();
  }

  // Fetch all requests in the group (אותה השאלה)
  const groupKey = request.requestGroupId ?? request.id;
  const groupRequests = request.requestGroupId
    ? await db.query.requests.findMany({
        where: eq(requests.requestGroupId, request.requestGroupId!),
        with: {
          itemType: true,
          department: true,
          itemUnit: true,
        },
        orderBy: (requests, { asc }) => [asc(requests.createdAt)],
      })
    : [{ ...request, itemUnit: null }];

  const canApprove =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    session.user.role === "dept_commander";

  return (
    <div>
      <PageHeader
        title={`השאלה #${request.id.slice(0, 8)}`}
        description={
          groupRequests.length > 1
            ? `${groupRequests.map((r) => r.itemType?.name).join(", ")} • ${groupRequests.length} פריטים`
            : `${request.itemType?.name || "-"} • ${request.department?.name || "-"}`
        }
        actions={
          <div className="flex items-center gap-2">
            {groupRequests.some((r) => r.status === "handed_over") && canApprove && (
              <Link href={`/dashboard/handover/group/${groupKey}/return`}>
                <Button variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <RotateCcw className="w-4 h-4" />
                  קבלת החזרה
                </Button>
              </Link>
            )}
            <Link href="/dashboard/requests">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">סטטוס ההשאלה</p>
                  <Badge className={`${getStatusColor(request.status)} text-lg px-4 py-1`}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
                <RequestStatusChange
                  requestId={request.id}
                  requestGroupId={request.requestGroupId}
                  groupRequestIds={groupRequests.map((r) => r.id)}
                  status={request.status}
                  canApprove={canApprove}
                />
              </div>
            </CardContent>
          </Card>

          {/* Item Details - כל הפריטים בהשאלה */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                פרטי הפריטים {groupRequests.length > 1 && `(${groupRequests.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <p className="text-sm text-slate-500">שם הפריט</p>
                        <p className="font-medium">{req.itemType?.name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">מק״ט</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          {req.itemType?.catalogNumber || "-"}
                        </code>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">כמות</p>
                        <p className="font-medium">{req.quantity} יח&apos;</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">מחלקה</p>
                        <p className="font-medium">{req.department?.name || "-"}</p>
                      </div>
                    </div>
                    {req.status === "handed_over" && canApprove && (
                      <SingleItemReturnButton
                        requestId={req.id}
                        itemName={req.itemType?.name || ""}
                        quantity={req.quantity}
                        itemType={req.itemType?.type || "quantity"}
                      />
                    )}
                    {req.status === "returned" && (
                      <span className="text-xs text-emerald-600 font-medium shrink-0">הוחזר</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                פרטי ההשאלה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">דחיפות</p>
                <Badge variant={request.urgency === "immediate" ? "destructive" : "info"}>
                  {request.urgency === "immediate" ? "מיידי" : "מתוזמן"}
                </Badge>
              </div>
              {request.purpose && (
                <div>
                  <p className="text-sm text-slate-500">מטרה</p>
                  <p>{request.purpose}</p>
                </div>
              )}
              {request.notes && (
                <div>
                  <p className="text-sm text-slate-500">הערות</p>
                  <p>{request.notes}</p>
                </div>
              )}
              {request.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium">סיבת דחייה:</p>
                  <p className="text-red-700">{request.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                ציר זמן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">ההשאלה הוגשה</p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                </div>

                {request.approvedAt && (
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      request.status === "rejected" ? "bg-red-100" : "bg-green-100"
                    }`}>
                      {request.status === "rejected" ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.status === "rejected" ? "ההשאלה נדחתה" : "ההשאלה אושרה"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(request.approvedAt)}
                        {request.approvedBy && ` • ${request.approvedBy.firstName} ${request.approvedBy.lastName}`}
                      </p>
                    </div>
                  </div>
                )}

                {request.handedOverAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">הפריט נמסר</p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(request.handedOverAt)}
                        {request.handedOverBy && ` • ${request.handedOverBy.firstName} ${request.handedOverBy.lastName}`}
                      </p>
                    </div>
                  </div>
                )}

                {request.returnedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">הפריט הוחזר</p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(request.returnedAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Requester Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי החייל המבקש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">שם</p>
                <p className="font-medium">
                  {request.recipientName || (request.requester ? `${request.requester.firstName || ""} ${request.requester.lastName || ""}`.trim() : "-")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">
                  {request.recipientPhone || request.requester?.phone || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                תאריכים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">תאריך הגשה</p>
                <p className="font-medium">{formatDateTime(request.createdAt)}</p>
              </div>
              {request.scheduledReturnAt && (
                <div>
                  <p className="text-sm text-slate-500">תאריך החזרה מתוכנן</p>
                  <p className="font-medium">{formatDateTime(request.scheduledReturnAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
