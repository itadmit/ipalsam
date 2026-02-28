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
  PenLine,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { HandoverForm } from "./handover-form";
import { db } from "@/db";
import { requests, itemUnits } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can do handover
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, id),
    with: {
      requester: true,
      itemType: true,
      approvedBy: true,
    },
  });

  if (!request) {
    notFound();
  }

  // Get available units for serial items
  let availableUnits: { id: string; serialNumber: string }[] = [];
  if (request.itemType?.type === "serial") {
    const units = await db.query.itemUnits.findMany({
      where: and(
        eq(itemUnits.itemTypeId, request.itemTypeId),
        eq(itemUnits.status, "available")
      ),
      columns: { id: true, serialNumber: true },
    });
    availableUnits = units;
  }

  const requestData = {
    id: request.id,
    requester: {
      name: request.recipientName || `${request.requester?.firstName || ""} ${request.requester?.lastName || ""}`.trim() || "-",
      phone: request.recipientPhone || request.requester?.phone || "",
    },
    item: {
      name: request.itemType?.name || "",
      catalogNumber: request.itemType?.catalogNumber || "",
      type: request.itemType?.type as "serial" | "quantity",
    },
    availableUnits,
    quantity: request.quantity,
    status: request.status,
    approvedAt: request.approvedAt || new Date(),
    approvedBy: request.approvedBy
      ? `${request.approvedBy.firstName} ${request.approvedBy.lastName}`
      : "",
  };

  return (
    <div>
      <PageHeader
        title="ביצוע מסירה"
        description={`השאלה #${request.id.slice(0, 8)}`}
        actions={
          <Link href="/dashboard/handover">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                מסירת ציוד
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HandoverForm request={requestData} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי המקבל
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">שם</p>
                <p className="font-medium">{requestData.requester.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">{requestData.requester.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Request Info */}
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
                <Badge variant="success">אושר</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">אושר ע״י</p>
                <p className="font-medium">{requestData.approvedBy}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך אישור</p>
                <p className="font-medium">{formatDateTime(requestData.approvedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="w-5 h-5" />
                הנחיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm space-y-2 list-decimal list-inside text-slate-600">
                <li>ודא את זהות המקבל</li>
                <li>בחר את היחידה/ות למסירה</li>
                <li>קבל חתימה מהמקבל</li>
                <li>לחץ &quot;בצע מסירה&quot;</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
