"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveOpenRequestItem, rejectOpenRequestItem } from "@/actions/open-requests";
import { Check, X } from "lucide-react";

interface OpenRequestItemActionsProps {
  itemId: string;
  status: string;
}

export function OpenRequestItemActions({ itemId, status }: OpenRequestItemActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  if (status !== "pending") {
    return (
      <span className="text-xs">
        {status === "approved" ? "אושר" : "נדחה"}
      </span>
    );
  }

  const handleApprove = async () => {
    setLoading("approve");
    try {
      const result = await approveOpenRequestItem(itemId);
      if (result.error) alert(result.error);
      else router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    const reason = prompt("סיבת דחייה (אופציונלי):");
    setLoading("reject");
    try {
      const result = await rejectOpenRequestItem(itemId, reason || undefined);
      if (result.error) alert(result.error);
      else router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        onClick={handleApprove}
        disabled={!!loading}
      >
        <Check className="w-3.5 h-3.5" />
        אישור
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 text-red-700 border-red-300 hover:bg-red-50"
        onClick={handleReject}
        disabled={!!loading}
      >
        <X className="w-3.5 h-3.5" />
        דחייה
      </Button>
    </div>
  );
}
