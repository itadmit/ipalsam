"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFuelCard, deleteFuelCard } from "@/actions/vehicles";
import { Trash2 } from "lucide-react";

interface FuelCardEditFormProps {
  cardId: string;
  departmentId: string;
  initialCardNumber: string;
  initialBalance: number;
}

export function FuelCardEditForm({
  cardId,
  departmentId,
  initialCardNumber,
  initialBalance,
}: FuelCardEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState(initialCardNumber);
  const [balance, setBalance] = useState((initialBalance / 100).toFixed(2));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const bal = Math.round(parseFloat(balance) * 100);
      if (isNaN(bal) || bal < 0) {
        setError("הזן יתרה תקינה");
        setLoading(false);
        return;
      }
      const result = await updateFuelCard(cardId, {
        cardNumber: cardNumber.trim(),
        balance: bal,
      });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== "מחק") return;
    setDeleteLoading(true);
    setError("");
    try {
      const result = await deleteFuelCard(cardId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/vehicles/fuel-cards?dept=${departmentId}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה במחיקה");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
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
        label="יתרה נוכחית (₪)"
        type="number"
        min={0}
        step="0.01"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
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

      <hr className="border-slate-200" />

      <div>
        <Button
          type="button"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4" />
          מחיקת כרטיס
        </Button>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 space-y-3">
            <p className="text-sm text-red-800 font-medium">אימות כפול – הזן &quot;מחק&quot; לאישור</p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="מחק"
              dir="ltr"
              className="text-center"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
              >
                ביטול
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deleteConfirmText !== "מחק"}
                loading={deleteLoading}
                onClick={handleDelete}
              >
                מחק כרטיס
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
