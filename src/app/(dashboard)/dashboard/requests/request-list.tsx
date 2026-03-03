"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
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
  totalPages?: number;
  currentPage?: number;
  totalCount?: number;
  pageSize?: number;
}

export function RequestList({ groups, totalPages = 1, currentPage = 1, totalCount = 0, pageSize = 15 }: RequestListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            מציג {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} מתוך {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
