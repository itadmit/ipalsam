"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function OpenRequestsExportButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const res = await fetch(`/api/open-requests/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `open-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("שגיאה בייצוא");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleExport}
      loading={loading}
      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
    >
      <Download className="w-4 h-4" />
      ייצוא CSV
    </Button>
  );
}
