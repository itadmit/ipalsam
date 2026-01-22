"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "חיפוש...",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") || "");

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    params.delete("page"); // Reset pagination

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400",
          isPending && "animate-pulse"
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}

