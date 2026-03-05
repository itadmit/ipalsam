"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteVehicle } from "@/actions/vehicles";
import { Trash2 } from "lucide-react";

interface VehicleDeleteButtonProps {
  vehicleId: string;
  departmentId: string;
}

export function VehicleDeleteButton({ vehicleId, departmentId }: VehicleDeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "מחק") return;
    setLoading(true);
    try {
      const result = await deleteVehicle(vehicleId);
      if ("error" in result && result.error) {
        alert(result.error);
      } else {
        router.push(`/dashboard/vehicles/list?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setConfirmText("");
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="w-4 h-4" />
        מחיקת רכב
      </Button>
      {showConfirm && (
        <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 space-y-3">
          <p className="text-sm text-red-800 font-medium">אימות כפול – הזן &quot;מחק&quot; לאישור</p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="מחק"
            dir="ltr"
            className="text-center max-w-[120px]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
            >
              ביטול
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={confirmText !== "מחק"}
              loading={loading}
              onClick={handleDelete}
            >
              מחק רכב
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
