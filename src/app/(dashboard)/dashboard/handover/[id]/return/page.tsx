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
import { ReturnForm } from "./return-form";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can accept returns
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, id),
    with: {
      requester: true,
      itemType: true,
      itemUnit: true,
    },
  });

  if (!request || request.status !== "handed_over") {
    notFound();
  }

  const dueDate = request.scheduledReturnAt || new Date();
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  const loanData = {
    id: request.id,
    holder: {
      name: `${request.requester?.firstName} ${request.requester?.lastName}`,
      phone: request.requester?.phone || "",
    },
    item: {
      name: request.itemType?.name || "",
      catalogNumber: request.itemType?.catalogNumber || "",
      type: request.itemType?.type as "serial" | "quantity",
    },
    serialNumber: request.itemUnit?.serialNumber || null,
    quantity: request.quantity,
    borrowedAt: request.handedOverAt || new Date(),
    dueDate,
    isOverdue,
    daysOverdue: isOverdue ? Math.abs(daysLeft) : 0,
  };

  return (
    <div>
      <PageHeader
        title="קבלת החזרה"
        description={`בקשה #${request.id.slice(0, 8)}`}
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
                פריט באיחור של {loanData.daysOverdue} ימים!
              </p>
              <p className="text-sm text-red-600">
                תאריך החזרה המקורי: {formatDate(dueDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                קבלת ציוד
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnForm loan={loanData} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Holder Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי המחזיר
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">שם</p>
                <p className="font-medium">{loanData.holder.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">{loanData.holder.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Loan Info */}
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
                <p className="font-medium">{formatDateTime(loanData.borrowedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך החזרה</p>
                <p className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
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
