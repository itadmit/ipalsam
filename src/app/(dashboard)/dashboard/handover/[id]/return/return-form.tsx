"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, AlertTriangle } from "lucide-react";

interface ReturnFormProps {
  loan: {
    id: string;
    holder: { name: string; phone: string };
    item: { name: string; catalogNumber: string; type: "serial" | "quantity" };
    serialNumber: string | null;
    quantity: number;
    isOverdue: boolean;
  };
}

export function ReturnForm({ loan }: ReturnFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [quantityReturned, setQuantityReturned] = useState(loan.quantity);
  const [condition, setCondition] = useState<"good" | "damaged" | "lost">("good");
  const [notes, setNotes] = useState("");

  const isSerial = loan.item.type === "serial";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isSerial && quantityReturned < 1) {
      setError("יש להזין כמות תקינה");
      return;
    }

    setLoading(true);

    try {
      // TODO: Call server action to execute return
      // await executeReturn(loan.id, quantityReturned, condition, notes);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/loans");
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
        <h3 className="text-xl font-semibold text-green-800 mb-2">ההחזרה בוצעה בהצלחה!</h3>
        <p className="text-slate-500">מעביר לדף ההשאלות...</p>
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
            <p className="font-semibold">{loan.item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-slate-200 px-2 py-0.5 rounded">
                {loan.item.catalogNumber}
              </code>
              {loan.serialNumber && (
                <code className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {loan.serialNumber}
                </code>
              )}
              {!isSerial && (
                <span className="text-sm text-slate-500">
                  כמות: {loan.quantity} יח'
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Input (for non-serial items) */}
      {!isSerial && (
        <Input
          id="quantity"
          label="כמות מוחזרת"
          type="number"
          min={1}
          max={loan.quantity}
          value={quantityReturned}
          onChange={(e) => setQuantityReturned(parseInt(e.target.value) || 1)}
          required
        />
      )}

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          מצב הציוד
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setCondition("good")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              condition === "good"
                ? "border-green-500 bg-green-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <CheckCircle
              className={`w-6 h-6 mx-auto mb-2 ${
                condition === "good" ? "text-green-600" : "text-slate-400"
              }`}
            />
            <p className={`text-sm font-medium ${
              condition === "good" ? "text-green-900" : "text-slate-700"
            }`}>
              תקין
            </p>
          </button>
          <button
            type="button"
            onClick={() => setCondition("damaged")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              condition === "damaged"
                ? "border-orange-500 bg-orange-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 mx-auto mb-2 ${
                condition === "damaged" ? "text-orange-600" : "text-slate-400"
              }`}
            />
            <p className={`text-sm font-medium ${
              condition === "damaged" ? "text-orange-900" : "text-slate-700"
            }`}>
              פגום
            </p>
          </button>
          <button
            type="button"
            onClick={() => setCondition("lost")}
            className={`p-4 rounded-lg border-2 transition-colors ${
              condition === "lost"
                ? "border-red-500 bg-red-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Package
              className={`w-6 h-6 mx-auto mb-2 ${
                condition === "lost" ? "text-red-600" : "text-slate-400"
              }`}
            />
            <p className={`text-sm font-medium ${
              condition === "lost" ? "text-red-900" : "text-slate-700"
            }`}>
              אבד
            </p>
          </button>
        </div>
      </div>

      {/* Notes - Required if damaged or lost */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          הערות {condition !== "good" && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={condition !== "good" ? "יש לתאר את הנזק/אובדן..." : "הערות להחזרה..."}
          rows={3}
          required={condition !== "good"}
          className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Warning for damaged/lost */}
      {condition !== "good" && (
        <div className={`p-4 rounded-lg border ${
          condition === "lost" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${
              condition === "lost" ? "text-red-600" : "text-orange-600"
            }`} />
            <p className={`text-sm font-medium ${
              condition === "lost" ? "text-red-800" : "text-orange-800"
            }`}>
              {condition === "lost"
                ? "דיווח על אובדן יעודכן במערכת ויפתח תהליך בירור"
                : "דיווח על נזק יעודכן במערכת והפריט יועבר לתחזוקה"}
            </p>
          </div>
        </div>
      )}

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
        <Button type="submit" className="flex-1" loading={loading}>
          <CheckCircle className="w-4 h-4" />
          קבל החזרה
        </Button>
      </div>
    </form>
  );
}

