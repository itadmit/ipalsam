import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Truck, History, Pencil } from "lucide-react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { KilometerageEditor } from "./kilometerage-editor";
import { VehicleDeleteButton } from "./vehicle-delete-button";
import { KilometerageHistoryList } from "./kilometerage-history-list";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, id),
    with: {
      department: { columns: { id: true, name: true } },
      kilometerageHistory: {
        with: { updatedBy: { columns: { firstName: true, lastName: true } } },
        orderBy: (h, { desc }) => [desc(h.createdAt)],
      },
    },
  });

  if (!vehicle) notFound();

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = (session.user.role === "dept_commander" || session.user.role === "soldier") && session.user.departmentId === vehicle.departmentId;
  if (!isAdmin && !isVehicleDept) notFound();

  const vehicleTypeDisplay = vehicle.vehicleType === "אחר" && vehicle.vehicleTypeOther
    ? `אחר (${vehicle.vehicleTypeOther})`
    : vehicle.vehicleType;
  const fitnessDisplay = vehicle.fitness === "אחר" && vehicle.fitnessOther
    ? `אחר (${vehicle.fitnessOther})`
    : vehicle.fitness;

  return (
    <div>
      <PageHeader
        title={`רכב ${vehicle.vehicleNumber}`}
        description={vehicle.department?.name}
        actions={
          <div className="flex gap-2">
            <Link href={`/dashboard/vehicles/${id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="w-4 h-4" />
                עריכה
              </Button>
            </Link>
            <VehicleDeleteButton vehicleId={id} departmentId={vehicle.departmentId} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {vehicle.vehicleType === "משאית" ? (
                <Truck className="w-5 h-5" />
              ) : (
                <Car className="w-5 h-5" />
              )}
              פרטי רכב
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">מס׳ רכב</p>
              <p className="font-medium">{vehicle.vehicleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">סוג רכב</p>
              <p className="font-medium">{vehicleTypeDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">כשירות</p>
              <Badge variant="secondary">{fitnessDisplay}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">קילומטראז</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{vehicle.kilometerage.toLocaleString()}</p>
                <KilometerageEditor vehicleId={id} currentKm={vehicle.kilometerage} />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">תאריך טיפול קודם</p>
              <p className="font-medium">{formatDate(vehicle.lastServiceDate) || "-"}</p>
            </div>
            {(vehicle.fuelCode || vehicle.fuelType) && (
              <div>
                <p className="text-sm text-slate-500">דלק</p>
                <p className="font-medium">
                  {vehicle.fuelCode && `קוד: ${vehicle.fuelCode}`}
                  {vehicle.fuelCode && vehicle.fuelType && " • "}
                  {vehicle.fuelType && `סוג: ${vehicle.fuelType}`}
                </p>
              </div>
            )}
            {vehicle.licenseUrl && (
              <div>
                <p className="text-sm text-slate-500">רישיון רכב</p>
                <a
                  href={vehicle.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  צפייה ברישיון
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              היסטוריית קילומטראז
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KilometerageHistoryList entries={vehicle.kilometerageHistory} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
