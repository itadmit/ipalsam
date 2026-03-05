import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileWarning, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { departments, accidentReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDateTime } from "@/lib/utils";
import { isVehicleDepartment } from "@/lib/vehicle-constants";

export default async function AccidentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = (session.user.role === "dept_commander" || session.user.role === "soldier") && session.user.departmentId === dept;

  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, dept),
    columns: { id: true, name: true, departmentType: true },
  });

  if (!department || !isVehicleDepartment(department)) {
    redirect("/dashboard/vehicles");
  }

  const reports = await db.query.accidentReports.findMany({
    where: eq(accidentReports.departmentId, dept),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  return (
    <div>
      <PageHeader
        title="דוחות תאונות"
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/report-accident?dept=${dept}`}>
            <Button className="gap-2">
              <FileWarning className="w-4 h-4" />
              דווח על תאונה
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          {reports.length === 0 ? (
            <EmptyState
              icon={FileWarning}
              title="אין דוחות תאונות"
              description="דוחות שידווחו יופיעו כאן"
            />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">רכב {r.vehicleNumber}</p>
                      <p className="text-sm text-slate-500">
                        מדווח: {r.reporterName} • {r.reporterPhone}
                        {r.reporterEmail && ` • ${r.reporterEmail}`}
                      </p>
                      {r.vehicleClassification && (
                        <p className="text-sm text-slate-500">סווג: {r.vehicleClassification}</p>
                      )}
                      <p className="text-sm text-slate-700 mt-2">{r.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{formatDateTime(r.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
