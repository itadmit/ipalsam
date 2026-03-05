"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteKilometerageHistory } from "@/actions/vehicles";
import { formatDateTime } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type HistoryEntry = {
  id: string;
  previousKm: number;
  newKm: number;
  createdAt: Date;
  updatedBy: { firstName: string; lastName: string } | null;
};

interface KilometerageHistoryListProps {
  entries: HistoryEntry[];
}

export function KilometerageHistoryList({ entries }: KilometerageHistoryListProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק רשומה זו מהיסטוריה?")) return;
    const result = await deleteKilometerageHistory(id);
    if ("error" in result && result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  };

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">אין עדכונים עדיין</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((h) => (
        <div
          key={h.id}
          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
        >
          <div>
            <p className="font-medium">
              {h.previousKm.toLocaleString()} → {h.newKm.toLocaleString()} ק״מ
            </p>
            <p className="text-sm text-slate-500">
              עודכן על ידי {h.updatedBy?.firstName} {h.updatedBy?.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{formatDateTime(h.createdAt)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(h.id)}
              title="מחיקת רשומה"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
