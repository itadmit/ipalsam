"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle } from "lucide-react";

interface HandoverFormProps {
  request: {
    id: string;
    requester: { name: string; phone: string };
    item: { name: string; catalogNumber: string; type: "serial" | "quantity" };
    availableUnits: { id: string; serialNumber: string }[];
    quantity: number;
  };
}

export function HandoverForm({ request }: HandoverFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [quantityToHandover, setQuantityToHandover] = useState(request.quantity);
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState(false);

  const isSerial = request.item.type === "serial";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSerial && !selectedUnitId) {
      setError("יש לבחור יחידה למסירה");
      return;
    }

    if (!isSerial && quantityToHandover < 1) {
      setError("יש להזין כמות תקינה");
      return;
    }

    if (!signature) {
      setError("יש לקבל חתימה מהמקבל");
      return;
    }

    setLoading(true);

    try {
      // TODO: Call server action to execute handover
      // await executeHandover(request.id, selectedUnitId, quantityToHandover, notes);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/handover");
        router.refresh();
      }, 2000);
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">המסירה בוצעה בהצלחה!</h3>
        <p className="text-slate-500">מעביר לדף המסירות...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Item Info */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-slate-500" />
          <div>
            <p className="font-semibold">{request.item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-slate-200 px-2 py-0.5 rounded">
                {request.item.catalogNumber}
              </code>
              <Badge variant="secondary">
                {isSerial ? "סריאלי" : "כמותי"}
              </Badge>
              <span className="text-sm text-slate-500">
                כמות מבוקשת: {request.quantity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Serial Unit Selection */}
      {isSerial && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            בחר יחידה למסירה
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {request.availableUnits.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`p-4 rounded-lg border-2 text-right transition-colors ${
                  selectedUnitId === unit.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <code className="text-sm font-medium">{unit.serialNumber}</code>
                {selectedUnitId === unit.id && (
                  <CheckCircle className="w-5 h-5 text-emerald-500 inline-block mr-2" />
                )}
              </button>
            ))}
          </div>
          {request.availableUnits.length === 0 && (
            <p className="text-sm text-red-500">אין יחידות זמינות למסירה</p>
          )}
        </div>
      )}

      {/* Quantity Input */}
      {!isSerial && (
        <Input
          id="quantity"
          label="כמות למסירה"
          type="number"
          min={1}
          max={request.quantity}
          value={quantityToHandover}
          onChange={(e) => setQuantityToHandover(parseInt(e.target.value) || 1)}
          required
        />
      )}

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          הערות (אופציונלי)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות למסירה..."
          rows={2}
          className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Signature */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="signature"
            checked={signature}
            onChange={(e) => setSignature(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="signature" className="text-sm">
            <span className="font-medium text-amber-800">אישור חתימה:</span>{" "}
            <span className="text-amber-700">
              המקבל ({request.requester.name}) אישר קבלת הציוד
            </span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
        >
          ביטול
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={loading}
          disabled={isSerial && request.availableUnits.length === 0}
        >
          <CheckCircle className="w-4 h-4" />
          בצע מסירה
        </Button>
      </div>
    </form>
  );
}

