import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ScanBarcode } from "lucide-react";
import { db } from "@/db";
import { users, departments, handoverDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CopyLinkButton } from "./copy-link-button";
import { QuickRequestSettings } from "./quick-request-settings";

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
  const personalLink = phoneDigits ? `${baseUrl}/request/${phoneDigits}` : `${baseUrl}/request`;
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
  const qrDataUrl = requestUrl ? await QRCode.toDataURL(requestUrl, { width: 160, margin: 1 }) : null;
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <ScanBarcode className="w-5 h-5" />
          השאלה מהירה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          {isDeptCommander
            ? "שתף את הלינק האישי שלך עם החיילים – הם יוכלו לבקש ציוד מהחנות שלך"
            : "שתף את הלינק עם החיילים כדי שיוכלו להגיש השאלה מהטלפון"}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm truncate">
            {requestUrl}
          </code>
          <CopyLinkButton url={requestUrl} />
          <Link href={requestUrl} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-4 h-4" />
              פתח
            </Button>
          </Link>
        </div>

        {isDeptCommander && department && (
          <QuickRequestSettings
            departmentId={department.id}
            autoApproveRequests={department.autoApproveRequests ?? false}
            storeDepartmentIds={
              storeDepartmentIds.length > 0 ? storeDepartmentIds : department.id ? [department.id] : []
            }
            departments={departmentsList}
          />
        )}

        <div className="pt-3 border-t border-emerald-200">
          <p className="text-sm font-medium text-slate-700 mb-1">ברקוד – הלינק להשאלה מהירה</p>
          <p className="text-xs text-slate-500 mb-2">
            הדפס את הלינק כ-QR או סרוק כדי להגיע להשאלה מהירה
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {qrDataUrl && (
              <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-slate-200">
                <img src={qrDataUrl} alt="QR להשאלה מהירה" width={160} height={160} />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <code className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm truncate">
                {requestUrl}
              </code>
              <CopyLinkButton url={requestUrl} label="העתק" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
