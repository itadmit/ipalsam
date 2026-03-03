"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "כל הסטטוסים" },
  { value: "submitted", label: "ממתינות לאישור" },
  { value: "processed", label: "טופלו (אושרו/נמסרו)" },
  { value: "rejected", label: "נדחו" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "תאריך (חדש לישן)" },
  { value: "date_asc", label: "תאריך (ישן לחדש)" },
  { value: "item_asc", label: "שם פריט (א-ב)" },
  { value: "item_desc", label: "שם פריט (ב-א)" },
];

export function RequestsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="סטטוס"
        value={searchParams.get("status") || ""}
        onChange={(e) => updateParam("status", e.target.value)}
        options={STATUS_OPTIONS}
        className="w-44"
      />
      <Select
        label="מיון"
        value={searchParams.get("sort") || "date_desc"}
        onChange={(e) => updateParam("sort", e.target.value)}
        options={SORT_OPTIONS}
        className="w-44"
      />
      <ExportCsvButton searchParams={searchParams} />
    </div>
  );
}

function ExportCsvButton({ searchParams }: { searchParams: URLSearchParams }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await fetch(`/api/requests/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("שגיאה בייצוא");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={loading} className="gap-1.5">
      <Download className="w-4 h-4" />
      ייצוא CSV
    </Button>
  );
}
