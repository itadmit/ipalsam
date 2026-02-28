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
  AlertTriangle,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";
import { GroupReturnButton } from "./group-return-button";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

export default async function GroupReturnPage({
  params,
}: {
  params: Promise<{ groupKey: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const { groupKey } = await params;

  let groupRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requestGroupId, groupKey),
      or(eq(requests.status, "approved"), eq(requests.status, "handed_over"))
    ),
    with: {
      requester: true,
      itemType: true,
      itemUnit: true,
    },
  });

  if (groupRequests.length === 0) {
    const single = await db.query.requests.findFirst({
      where: and(
        eq(requests.id, groupKey),
        or(eq(requests.status, "approved"), eq(requests.status, "handed_over"))
      ),
      with: {
        requester: true,
        itemType: true,
        itemUnit: true,
      },
    });
    if (single) groupRequests = [single];
  }

  if (groupRequests.length === 0) {
    notFound();
  }

  const first = groupRequests[0];
  const dueDate = first.scheduledReturnAt || new Date();
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  const recipientName =
    first.recipientName ||
    `${first.requester?.firstName || ""} ${first.requester?.lastName || ""}`.trim() ||
    "-";
  const recipientPhone = first.recipientPhone || first.requester?.phone || "-";

  return (
    <div>
      <PageHeader
        title="קבלת החזרה"
        description={`השאלה • ${groupRequests.length} פריטים`}
        actions={
          <Link href="/dashboard/loans">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      {isOverdue && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                השאלה באיחור של {Math.abs(daysLeft)} ימים!
              </p>
              <p className="text-sm text-red-600">
                תאריך החזרה המקורי: {formatDate(dueDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                פריטים בהשאלה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <p className="font-medium">{req.itemType?.name}</p>
                      <p className="text-sm text-slate-500">
                        {req.itemType?.catalogNumber && (
                          <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">
                            {req.itemType.catalogNumber}
                          </code>
                        )}{" "}
                        {req.itemUnit?.serialNumber && (
                          <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs mr-1">
                            {req.itemUnit.serialNumber}
                          </code>
                        )}
                        {req.itemType?.type === "quantity" && (
                          <span className="text-slate-500">
                            • {req.quantity} יח'
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <GroupReturnButton groupKey={groupKey} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי החייל המבקש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">שם</p>
                <p className="font-medium">{recipientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">
                  {recipientPhone}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                פרטי ההשאלה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">סטטוס</p>
                {isOverdue ? (
                  <Badge variant="destructive">באיחור</Badge>
                ) : (
                  <Badge variant="info">בהשאלה</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך השאלה</p>
                <p className="font-medium">
                  {first.handedOverAt &&
                    formatDateTime(first.handedOverAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך החזרה</p>
                <p
                  className={`font-medium ${isOverdue ? "text-red-600" : ""}`}
                >
                  {formatDate(dueDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
