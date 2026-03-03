import { headers } from "next/headers";
import QRCode from "qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScanBarcode } from "lucide-react";
import { db } from "@/db";
import { users, departments, handoverDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuickRequestActions } from "./quick-request-actions";

interface QuickRequestCardProps {
  userId: string;
}

export async function QuickRequestCard({ userId }: QuickRequestCardProps) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true, phone: true, departmentId: true },
  });

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const phoneDigits = (user?.phone || "").replace(/\D/g, "").slice(-10);
  const personalLink = phoneDigits ? `${baseUrl}/profile/${phoneDigits}` : `${baseUrl}/request`;
  const requestUrl = personalLink;

  const isDeptCommander = user?.role === "dept_commander";
  const department = user?.departmentId
    ? await db.query.departments.findFirst({
        where: eq(departments.id, user.departmentId),
        columns: { id: true, baseId: true, autoApproveRequests: true },
      })
    : null;

  const handoverDepts = isDeptCommander
    ? await db.query.handoverDepartments.findMany({
        where: eq(handoverDepartments.userId, userId),
        columns: { departmentId: true },
      })
    : [];

  const storeDepartmentIds = handoverDepts.map((d) => d.departmentId);
  const qrDataUrl = requestUrl ? await QRCode.toDataURL(requestUrl, { width: 80, margin: 1 }) : null;
  const qrDataUrl1080 = requestUrl ? await QRCode.toDataURL(requestUrl, { width: 1080, margin: 1 }) : null;
  const departmentsList =
    isDeptCommander && department?.baseId
      ? await db.query.departments.findMany({
          where: eq(departments.baseId, department.baseId),
          columns: { id: true, name: true },
          orderBy: (d, { asc }) => [asc(d.name)],
        })
      : [];

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-emerald-800 text-base">
          <ScanBarcode className="w-4 h-4" />
          השאלה מהירה
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {qrDataUrl && (
            <a href={requestUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src={qrDataUrl} alt="QR לינק" width={64} height={64} className="rounded border border-slate-200 bg-white p-1" />
            </a>
          )}
          <div className="flex-1 min-w-0">
            <QuickRequestActions
              requestUrl={requestUrl}
              qrDataUrl1080={qrDataUrl1080}
              isDeptCommander={isDeptCommander}
              departmentId={department?.id}
              autoApproveRequests={department?.autoApproveRequests ?? false}
              storeDepartmentIds={
                storeDepartmentIds.length > 0 ? storeDepartmentIds : department?.id ? [department.id] : []
              }
              departments={departmentsList}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
