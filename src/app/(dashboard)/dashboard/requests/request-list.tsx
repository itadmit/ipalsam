"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Package, User, ChevronLeft } from "lucide-react";
import { getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";

interface RequestListProps {
  groups: {
    groupKey: string;
    firstId: string;
    recipientName: string;
    recipientPhone: string;
    reqs: { id: string; itemType?: { name: string } | null; quantity: number }[];
    departmentName: string;
    urgency: "immediate" | "scheduled";
    status: string;
    createdAt: Date;
  }[];
}

export function RequestList({ groups }: RequestListProps) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {groups.map(({ groupKey, firstId, recipientName, recipientPhone, reqs, departmentName, urgency, status, createdAt }) => (
        <button
          key={groupKey}
          type="button"
          onClick={() => router.push(`/dashboard/requests/${firstId}`)}
          className="w-full text-right p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{recipientName}</p>
              <p className="text-sm text-slate-500 truncate" dir="ltr">
                {recipientPhone}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {reqs.map((r) => `${r.itemType?.name || ""}${r.quantity > 1 ? ` (${r.quantity})` : ""}`).join(" • ")}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={urgency === "immediate" ? "destructive" : "info"} className="text-xs">
                  {urgency === "immediate" ? "מיידי" : "מתוזמן"}
                </Badge>
                <Badge className={`${getStatusColor(status)} text-xs`}>
                  {getStatusLabel(status)}
                </Badge>
                <span className="text-xs text-slate-400">{formatDateTime(createdAt)}</span>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
          </div>
        </button>
      ))}
    </div>
  );
}
