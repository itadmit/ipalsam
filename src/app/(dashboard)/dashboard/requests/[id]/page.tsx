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
} from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";

// TODO: Replace with actual DB fetch
async function getRequest(id: string) {
  const requests: Record<string, {
    id: string;
    requester: { name: string; phone: string; email: string | null };
    item: { name: string; catalogNumber: string; type: string };
    department: string;
    quantity: number;
    urgency: "immediate" | "scheduled";
    purpose: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    approvedBy: string | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    handedOverBy: string | null;
    handedOverAt: Date | null;
    returnedAt: Date | null;
  }> = {
    "1": {
      id: "1",
      requester: { name: "יוסי כהן", phone: "0541234567", email: "yosi@example.com" },
      item: { name: "מכשיר קשר דגם X", catalogNumber: "K-2341", type: "serial" },
      department: "קשר",
      quantity: 1,
      urgency: "immediate",
      purpose: "אימון שטח",
      notes: "צריך עד סוף השבוע",
      status: "submitted",
      createdAt: new Date("2026-01-22T09:30:00"),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      handedOverBy: null,
      handedOverAt: null,
      returnedAt: null,
    },
  };
  return requests[id] || null;
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    notFound();
  }

  const canApprove =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    session.user.role === "dept_commander";

  const isRequester = request.requester.phone === session.user.phone;

  return (
    <div>
      <PageHeader
        title={`בקשה #${request.id}`}
        description={`${request.item.name} • ${request.department}`}
        actions={
          <Link href="/dashboard/requests">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">סטטוס הבקשה</p>
                  <Badge className={`${getStatusColor(request.status)} text-lg px-4 py-1`}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
                {canApprove && request.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="text-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4" />
                      דחה
                    </Button>
                    <Button>
                      <CheckCircle className="w-4 h-4" />
                      אשר
                    </Button>
                  </div>
                )}
                {canApprove && request.status === "approved" && (
                  <Link href={`/dashboard/handover/${request.id}`}>
                    <Button>
                      <Package className="w-4 h-4" />
                      בצע מסירה
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                פרטי הפריט
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">שם הפריט</p>
                  <p className="font-medium">{request.item.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">מק״ט</p>
                  <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                    {request.item.catalogNumber}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-slate-500">כמות</p>
                  <p className="font-medium">{request.quantity} יח'</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">מחלקה</p>
                  <p className="font-medium">{request.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                פרטי הבקשה
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
                    <p className="font-medium">הבקשה הוגשה</p>
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
                        {request.status === "rejected" ? "הבקשה נדחתה" : "הבקשה אושרה"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(request.approvedAt)}
                        {request.approvedBy && ` • ${request.approvedBy}`}
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
                        {request.handedOverBy && ` • ${request.handedOverBy}`}
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
                פרטי המבקש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">שם</p>
                <p className="font-medium">{request.requester.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">{request.requester.phone}</p>
              </div>
              {request.requester.email && (
                <div>
                  <p className="text-sm text-slate-500">אימייל</p>
                  <p className="font-medium">{request.requester.email}</p>
                </div>
              )}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

