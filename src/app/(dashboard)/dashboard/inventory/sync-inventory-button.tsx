"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncInventoryQuantities } from "@/actions/inventory";

export function SyncInventoryButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncInventoryQuantities();
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
        if (result.fixed && result.fixed > 0) {
          alert(`סונכרן: ${result.fixed} פריטים תוקנו`);
        }
      }
    } catch {
      alert("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      loading={loading}
      className="gap-1.5"
      title="סנכרן מלאי לפי השאלות הפעילות"
    >
      <RefreshCw className="w-4 h-4" />
      סנכרן מלאי
    </Button>
  );
}
