"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFuelCard } from "@/actions/vehicles";

interface FuelCardFormProps {
  departmentId: string;
}

export function FuelCardForm({ departmentId }: FuelCardFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [initialAmount, setInitialAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const amount = parseFloat(initialAmount);
      if (isNaN(amount) || amount < 0) {
        setError("הזן סכום תקין");
        setLoading(false);
        return;
      }
      const result = await createFuelCard({
        departmentId,
        cardNumber: cardNumber.trim(),
        initialAmount: Math.round(amount * 100), // אגורות
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/vehicles/fuel-cards?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Input
        label="מספר כרטיס"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        required
      />

      <Input
        label="סכום התחלתי (₪)"
        type="number"
        min={0}
        step="0.01"
        value={initialAmount}
        onChange={(e) => setInitialAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          ביטול
        </Button>
        <Button type="submit" className="flex-1" loading={loading}>
          שמור
        </Button>
      </div>
    </form>
  );
}
