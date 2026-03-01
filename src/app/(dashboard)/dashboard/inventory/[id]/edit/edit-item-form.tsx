"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateItemType } from "@/actions/inventory";

interface EditItemFormProps {
  item: {
    id: string;
    name: string;
    catalogNumber: string;
    categoryId: string;
    description: string;
    notes: string;
    minimumAlert: number;
    requiresDoubleApproval: boolean;
    maxLoanDays: number | null;
    type: "serial" | "quantity";
    quantityTotal?: number;
    quantityAvailable?: number;
    quantityInUse?: number;
  };
  categories: { id: string; name: string }[];
}

export function EditItemForm({ item, categories }: EditItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(item.name);
  const [catalogNumber, setCatalogNumber] = useState(item.catalogNumber);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [description, setDescription] = useState(item.description);
  const [notes, setNotes] = useState(item.notes);
  const [minimumAlert, setMinimumAlert] = useState(item.minimumAlert);
  const [requiresDoubleApproval, setRequiresDoubleApproval] = useState(item.requiresDoubleApproval);
  const [maxLoanDays, setMaxLoanDays] = useState(item.maxLoanDays || 0);
  const [quantityTotal, setQuantityTotal] = useState(item.quantityTotal || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateItemType(item.id, {
        name,
        catalogNumber,
        categoryId,
        description,
        notes,
        minimumAlert,
        requiresDoubleApproval,
        maxLoanDays: maxLoanDays || undefined,
        ...(item.type === "quantity" && { quantityTotal }),
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/inventory/${item.id}`);
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה. אנא נסה שוב");
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

      <div className="space-y-4">
        <Input
          id="name"
          label="שם מוצר"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          id="catalogNumber"
          label="מק״ט / מס״ב / צ׳"
          value={catalogNumber}
          onChange={(e) => setCatalogNumber(e.target.value)}
        />

        <Select
          id="category"
          label="קטגוריה"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={[
            { value: "", label: "ללא קטגוריה" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          placeholder="בחר קטגוריה"
        />

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            תיאור
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            הערות
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {item.type === "quantity" && (
          <Input
            id="quantityTotal"
            label="כמות כוללת"
            type="number"
            min={item.quantityInUse || 0}
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(parseInt(e.target.value) || 0)}
          />
        )}

        <Input
          id="minimumAlert"
          label="התראת מלאי נמוך (כמות)"
          type="number"
          min={0}
          value={minimumAlert}
          onChange={(e) => setMinimumAlert(parseInt(e.target.value) || 0)}
        />

        <Input
          id="maxLoanDays"
          label="מקסימום ימי השאלה (0 = ללא הגבלה)"
          type="number"
          min={0}
          value={maxLoanDays}
          onChange={(e) => setMaxLoanDays(parseInt(e.target.value) || 0)}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="requiresDoubleApproval"
            checked={requiresDoubleApproval}
            onChange={(e) => setRequiresDoubleApproval(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="requiresDoubleApproval" className="text-sm text-slate-700">
            דורש אישור כפול (מפקד מחלקה + מפקדה)
          </label>
        </div>
      </div>

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
          שמור שינויים
        </Button>
      </div>
    </form>
  );
}

