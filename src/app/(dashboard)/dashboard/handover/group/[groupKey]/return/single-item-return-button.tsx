"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { returnItem } from "@/actions/requests";
import { RotateCcw } from "lucide-react";

interface SingleItemReturnButtonProps {
  requestId: string;
  itemName: string;
  quantity: number;
  itemType: "quantity" | "serial";
}

export function SingleItemReturnButton({
  requestId,
  itemName,
  quantity,
  itemType,
}: SingleItemReturnButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [returnQty, setReturnQty] = useState(quantity);

  const isQuantityItem = itemType === "quantity";
  const canPartial = isQuantityItem && quantity > 1;

  const handleReturn = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const qty = canPartial ? Math.min(Math.max(1, returnQty), quantity) : quantity;
    setLoading(true);
    try {
      const result = await returnItem(requestId, { confirmed: true }, {
        returnQuantity: canPartial ? qty : undefined,
      });
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
    <div className="flex items-center gap-2 shrink-0">
      {canPartial && (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            max={quantity}
            value={returnQty}
            onChange={(e) => setReturnQty(Number(e.target.value) || 1)}
            className="w-16 h-8 text-center text-sm"
          />
          <span className="text-xs text-slate-500">מתוך {quantity}</span>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        onClick={handleReturn}
        disabled={loading}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        הוחזר
      </Button>
    </div>
  );
}
