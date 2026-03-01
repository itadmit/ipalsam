"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { returnItem } from "@/actions/requests";
import { RotateCcw } from "lucide-react";

interface SingleItemReturnButtonProps {
  requestId: string;
  itemName: string;
}

export function SingleItemReturnButton({ requestId, itemName }: SingleItemReturnButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReturn = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await returnItem(requestId, { confirmed: true });
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch {
      alert("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0"
      onClick={handleReturn}
      disabled={loading}
    >
      <RotateCcw className="w-3.5 h-3.5" />
      הוחזר
    </Button>
  );
}
