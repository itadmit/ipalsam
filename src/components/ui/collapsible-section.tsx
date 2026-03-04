"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  badge,
  children,
  className,
  id,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-slate-50/50 transition-colors"
      >
        <span className="font-semibold text-slate-900">{title}</span>
        <div className="flex items-center gap-2">
          {badge}
          {open ? (
            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
          )}
        </div>
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
}
