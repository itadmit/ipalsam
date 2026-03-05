"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteVehicle } from "@/actions/vehicles";
import { Car, Truck, ArrowRight, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { VEHICLE_TYPES_MAP } from "@/lib/vehicle-constants";

interface VehicleListItemProps {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleTypeOther: string | null;
  fitness: string;
  fitnessOther: string | null;
  kilometerage: number;
  lastServiceDate: Date | null;
  departmentId: string;
}

export function VehicleListItem({
  id,
  vehicleNumber,
  vehicleType,
  vehicleTypeOther,
  fitness,
  fitnessOther,
  kilometerage,
  lastServiceDate,
  departmentId,
}: VehicleListItemProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("למחוק רכב זה? פעולה זו בלתי הפיכה.")) return;
    const result = await deleteVehicle(id);
    if ("error" in result && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50 transition-colors group">
      <Link
        href={`/dashboard/vehicles/${id}`}
        className="flex-1 flex items-center gap-4 min-w-0"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          {vehicleType === "משאית" ? (
            <Truck className="w-6 h-6 text-emerald-600" />
          ) : (
            <Car className="w-6 h-6 text-emerald-600" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">מס׳ רכב: {vehicleNumber}</p>
          <p className="text-sm text-slate-500">
            {VEHICLE_TYPES_MAP[vehicleType] || vehicleType}
            {vehicleTypeOther && ` (${vehicleTypeOther})`} • {fitness}
            {fitnessOther && ` (${fitnessOther})`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            קילומטראז: {kilometerage.toLocaleString()} • טיפול אחרון: {formatDate(lastServiceDate) || "-"}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:bg-red-50 shrink-0"
        onClick={handleDelete}
        title="מחיקת רכב"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
