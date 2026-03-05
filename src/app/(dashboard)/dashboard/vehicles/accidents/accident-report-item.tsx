"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAccidentReport } from "@/actions/vehicles";
import { Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AccidentReportItemProps {
  id: string;
  vehicleNumber: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string | null;
  vehicleClassification: string | null;
  description: string;
  createdAt: Date;
}

export function AccidentReportItem({
  id,
  vehicleNumber,
  reporterName,
  reporterPhone,
  reporterEmail,
  vehicleClassification,
  description,
  createdAt,
}: AccidentReportItemProps) {
  const router = useRouter();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("למחוק דוח תאונה זה?")) return;
    setDeleteLoading(true);
    try {
      const result = await deleteAccidentReport(id);
      if ("error" in result && result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("אירעה שגיאה");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">רכב {vehicleNumber}</p>
          <p className="text-sm text-slate-500">
            מדווח: {reporterName} • {reporterPhone}
            {reporterEmail && ` • ${reporterEmail}`}
          </p>
          {vehicleClassification && (
            <p className="text-sm text-slate-500">סווג: {vehicleClassification}</p>
          )}
          <p className="text-sm text-slate-700 mt-2">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">{formatDateTime(createdAt)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleteLoading}
            title="מחיקת דוח"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
