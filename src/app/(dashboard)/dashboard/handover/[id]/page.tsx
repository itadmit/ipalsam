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
  CheckCircle,
  PenLine,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { HandoverForm } from "./handover-form";

// TODO: Replace with actual DB fetch
async function getHandoverRequest(id: string) {
  const requests: Record<string, {
    id: string;
    requester: { name: string; phone: string };
    item: { name: string; catalogNumber: string; type: "serial" | "quantity" };
    availableUnits: { id: string; serialNumber: string }[];
    quantity: number;
    status: string;
    approvedAt: Date;
    approvedBy: string;
  }> = {
    "1": {
      id: "1",
      requester: { name: "יוסי כהן", phone: "0541234567" },
      item: { name: "מכשיר קשר דגם X", catalogNumber: "K-2341", type: "serial" },
      availableUnits: [
        { id: "u1", serialNumber: "K-2341-001" },
        { id: "u2", serialNumber: "K-2341-002" },
        { id: "u3", serialNumber: "K-2341-003" },
      ],
      quantity: 1,
      status: "approved",
      approvedAt: new Date("2026-01-22T09:00:00"),
      approvedBy: "ולרי כהן",
    },
    "2": {
      id: "2",
      requester: { name: "דנה לוי", phone: "0529876543" },
      item: { name: "סוללות AA", catalogNumber: "B-5500", type: "quantity" },
      availableUnits: [],
      quantity: 10,
      status: "approved",
      approvedAt: new Date("2026-01-22T08:30:00"),
      approvedBy: "ולרי כהן",
    },
  };
  return requests[id] || null;
}

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
  const request = await getHandoverRequest(id);

  if (!request) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="ביצוע מסירה"
        description={`בקשה #${request.id}`}
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
              <HandoverForm request={request} />
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
                <p className="font-medium">{request.requester.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">טלפון</p>
                <p className="font-medium" dir="ltr">{request.requester.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                פרטי הבקשה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">סטטוס</p>
                <Badge variant="success">אושר</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">אושר ע״י</p>
                <p className="font-medium">{request.approvedBy}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">תאריך אישור</p>
                <p className="font-medium">{formatDateTime(request.approvedAt)}</p>
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

