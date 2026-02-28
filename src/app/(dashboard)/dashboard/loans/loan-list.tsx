"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ChevronLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LoanListProps {
  groups: {
    groupKey: string;
    recipientName: string;
    recipientPhone: string;
    loans: { id: string; itemType?: { name: string } | null; quantity: number }[];
    departmentName: string;
    handedOverAt: Date | null;
    earliestDue: Date;
    minDaysLeft: number;
  }[];
}

export function LoanList({ groups }: LoanListProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Link
          key={group.groupKey}
          href={`/dashboard/handover/group/${group.groupKey}/return`}
          className="block"
        >
          <div
            className={`w-full text-right p-4 rounded-xl border hover:border-emerald-200 active:scale-[0.99] transition-all cursor-pointer shadow-sm ${
              group.minDaysLeft < 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  group.minDaysLeft < 0 ? "bg-red-100" : "bg-emerald-100"
                }`}
              >
                <Package
                  className={`w-6 h-6 ${group.minDaysLeft < 0 ? "text-red-600" : "text-emerald-600"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{group.recipientName}</p>
                <p className="text-sm text-slate-500 truncate" dir="ltr">
                  {group.recipientPhone}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {group.loans.map((l) => `${l.itemType?.name || ""}${l.quantity > 1 ? ` (${l.quantity})` : ""}`).join(" • ")}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {group.minDaysLeft < 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      {Math.abs(group.minDaysLeft)} ימים באיחור
                    </Badge>
                  ) : group.minDaysLeft === 0 ? (
                    <Badge variant="warning" className="text-xs">
                      היום!
                    </Badge>
                  ) : group.minDaysLeft <= 2 ? (
                    <Badge variant="warning" className="text-xs">
                      {group.minDaysLeft} ימים
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {group.minDaysLeft} ימים
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400">
                    להחזרה: {formatDate(group.earliestDue)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <span className="text-xs text-emerald-600 font-medium">הוחזר</span>
                <ChevronLeft className="w-5 h-5 text-slate-400 mt-1" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
