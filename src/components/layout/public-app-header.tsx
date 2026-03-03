"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PublicAppHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function PublicAppHeader({ backHref, backLabel = "חזרה" }: PublicAppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-14 px-4">
        <div />
        <Link href="/profile" className="flex justify-center">
          <span className="text-lg font-bold text-emerald-700" style={{ fontFamily: "var(--font-smooch-sans), system-ui, sans-serif" }}>iPalsam</span>
        </Link>
        <div className="flex justify-end">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center justify-center w-10 h-10 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              title={backLabel}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
