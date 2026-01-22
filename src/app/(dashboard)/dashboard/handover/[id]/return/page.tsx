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

// TODO: Replace with actual DB fetch
async function getLoan(id: string) {
  const loans: Record<string, {
    id: string;
    holder: { name: string; phone: string };
    item: { name: string; catalogNumber: string; type: "serial" | "quantity" };
    serialNumber: string | null;
    quantity: number;
    borrowedAt: Date;
    dueDate: Date;
    isOverdue: boolean;
    daysOverdue: number;
  }> = {
    "1": {
      id: "1",
      holder: { name: "יוסי כהן", phone: "0541234567" },
      item: { name: "מכשיר קשר דגם X", catalogNumber: "K-2341", type: "serial" },
      serialNumber: "K-2341-015",
      quantity: 1,
      borrowedAt: new Date("2026-01-20T09:00:00"),
      dueDate: new Date("2026-01-27T17:00:00"),
      isOverdue: false,
      daysOverdue: 0,
    },
    "2": {
      id: "2",
      holder: { name: "שרה גולן", phone: "0523334455" },
      item: { name: "מכשיר קשר דגם X", catalogNumber: "K-2341", type: "serial" },
      serialNumber: "K-2341-022",
      quantity: 1,
      borrowedAt: new Date("2026-01-15T10:00:00"),
      dueDate: new Date("2026-01-20T17:00:00"),
      isOverdue: true,
      daysOverdue: 2,
    },
    "3": {
      id: "3",
      holder: { name: "דנה לוי", phone: "0529876543" },
      item: { name: "סוללות AA", catalogNumber: "B-5500", type: "quantity" },
      serialNumber: null,
      quantity: 10,
      borrowedAt: new Date("2026-01-21T08:30:00"),
      dueDate: new Date("2026-01-28T17:00:00"),
      isOverdue: false,
      daysOverdue: 0,
    },
  };
  return loans[id] || null;
}

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
  const loan = await getLoan(id);

  if (!loan) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="קבלת החזרה"
        description={`השאלה #${loan.id}`}
        actions={
          <Link href="/dashboard/loans">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      {loan.isOverdue && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                פריט באיחור של {loan.daysOverdue} ימים!
              </p>
              <p className="text-sm text-red-600">
                תאריך החזרה המקורי: {formatDate(loan.dueDate)}
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
              <ReturnForm loan={loan} />
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
                <p className="font-medium">{loan.holder.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">{loan.holder.phone}</p>
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
                {loan.isOverdue ? (
                  <Badge variant="destructive">באיחור</Badge>
                ) : (
                  <Badge variant="info">בהשאלה</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך השאלה</p>
                <p className="font-medium">{formatDateTime(loan.borrowedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך החזרה</p>
                <p className={`font-medium ${loan.isOverdue ? "text-red-600" : ""}`}>
                  {formatDate(loan.dueDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

