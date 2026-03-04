"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, User, Package, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_CONFIG = [
  { key: "date", asc: "date_asc", desc: "date_desc", icon: Calendar, label: "תאריך" },
  { key: "dept", asc: "dept_asc", desc: "dept_desc", icon: Building2, label: "מחלקה" },
  { key: "requester", asc: "requester_asc", desc: "requester_desc", icon: User, label: "מבקש" },
  { key: "item", asc: "item_asc", desc: "item_desc", icon: Package, label: "שם הפריט" },
] as const;

const STATUS_TABS = [
  { value: "", label: "הכל" },
  { value: "pending", label: "ממתינות" },
  { value: "processed", label: "טופלו" },
] as const;

type UserFilter = "all" | "pending_only" | "processed_only";

interface OpenRequestsToolbarProps {
  userFilter?: UserFilter;
  effectiveStatus?: string;
}

export function OpenRequestsToolbar({ userFilter, effectiveStatus }: OpenRequestsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "date_desc";
  const currentStatus = effectiveStatus ?? searchParams.get("status") ?? "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSortClick = (config: (typeof SORT_CONFIG)[number]) => {
    const isDate = config.key === "date" && currentSort.startsWith("date");
    const isDept = config.key === "dept" && currentSort.startsWith("dept");
    const isRequester = config.key === "requester" && currentSort.startsWith("requester");
    const isItem = config.key === "item" && currentSort.startsWith("item");
    const isActive = isDate || isDept || isRequester || isItem;
    const isAsc = currentSort.endsWith("_asc");
    if (isActive) {
      updateParam("sort", isAsc ? config.desc : config.asc);
    } else {
      updateParam("sort", config.desc);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
      {/* לשוניות סטטוס – בצד ימין (מוסתרות כשהמשתמש מוגבל) */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-slate-200 order-1 sm:order-2">
        {(userFilter === "processed_only"
          ? STATUS_TABS.filter((t) => t.value === "processed")
          : userFilter === "pending_only"
            ? STATUS_TABS.filter((t) => t.value === "pending")
            : STATUS_TABS
        ).map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.value || "all"}
              onClick={() => updateParam("status", tab.value)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* אייקוני מיון – בצד שמאל */}
      <div className="flex items-center gap-1 order-2 sm:order-1">
        <span className="text-sm text-slate-500 ml-2">מיון:</span>
        {SORT_CONFIG.map((config) => {
          const Icon = config.icon;
          const isDate = config.key === "date" && (currentSort.startsWith("date"));
          const isDept = config.key === "dept" && (currentSort.startsWith("dept"));
          const isRequester = config.key === "requester" && (currentSort.startsWith("requester"));
          const isItem = config.key === "item" && (currentSort.startsWith("item"));
          const isActive = isDate || isDept || isRequester || isItem;
          const isAsc = currentSort.endsWith("_asc");

          return (
            <Button
              key={config.key}
              variant={isActive ? "default" : "outline"}
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0 relative",
                isActive && "bg-emerald-600 hover:bg-emerald-700"
              )}
              onClick={() => handleSortClick(config)}
              title={`${config.label} (${isAsc ? "עולה" : "יורד"})`}
            >
              <Icon className="w-4 h-4" />
              {isActive && (
                <span className="absolute left-0.5 bottom-0.5">
                  {isAsc ? (
                    <ArrowUp className="w-2.5 h-2.5 text-white/90" />
                  ) : (
                    <ArrowDown className="w-2.5 h-2.5 text-white/90" />
                  )}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
