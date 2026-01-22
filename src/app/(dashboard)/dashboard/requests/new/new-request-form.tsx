"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createRequest } from "@/actions/requests";
import { Package, Clock, FileText } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  available: number;
}

interface NewRequestFormProps {
  departments: Department[];
  itemsByDepartment: Record<string, Item[]>;
}

export function NewRequestForm({
  departments,
  itemsByDepartment,
}: NewRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState<"immediate" | "scheduled">("immediate");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const availableItems = departmentId ? itemsByDepartment[departmentId] || [] : [];
  const selectedItem = availableItems.find((i) => i.id === itemTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!departmentId || !itemTypeId) {
      setError("יש לבחור מחלקה ופריט");
      return;
    }

    if (selectedItem && quantity > selectedItem.available) {
      setError(`לא ניתן לבקש יותר מ-${selectedItem.available} יחידות`);
      return;
    }

    setLoading(true);

    try {
      const result = await createRequest({
        departmentId,
        itemTypeId,
        quantity,
        urgency,
        purpose: purpose || undefined,
        notes: notes || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/requests");
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
        <Select
          id="department"
          label="מחלקה"
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setItemTypeId("");
          }}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="בחר מחלקה"
          required
        />

        <Select
          id="item"
          label="פריט"
          value={itemTypeId}
          onChange={(e) => setItemTypeId(e.target.value)}
          options={availableItems.map((i) => ({
            value: i.id,
            label: `${i.name} (${i.available} זמין)`,
          }))}
          placeholder={departmentId ? "בחר פריט" : "בחר מחלקה קודם"}
          disabled={!departmentId || availableItems.length === 0}
          required
        />

        {selectedItem && (
          <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <Package className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-900">{selectedItem.name}</p>
              <p className="text-sm text-emerald-700">
                {selectedItem.available} יחידות זמינות
              </p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            כמות
          </label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={selectedItem?.available || 999}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            דחיפות
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUrgency("immediate")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                urgency === "immediate"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Clock
                className={`w-5 h-5 mx-auto mb-2 ${
                  urgency === "immediate" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  urgency === "immediate" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                מיידי
              </p>
              <p className="text-xs text-slate-500 mt-1">אקח היום</p>
            </button>
            <button
              type="button"
              onClick={() => setUrgency("scheduled")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                urgency === "scheduled"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <FileText
                className={`w-5 h-5 mx-auto mb-2 ${
                  urgency === "scheduled" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  urgency === "scheduled" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                מתוזמן
              </p>
              <p className="text-xs text-slate-500 mt-1">לתאריך עתידי</p>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="purpose"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            מטרה (אופציונלי)
          </label>
          <Input
            id="purpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="לאיזה צורך נדרש הציוד?"
          />
        </div>

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
            placeholder="הערות נוספות..."
            rows={3}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
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
          שלח בקשה
        </Button>
      </div>
    </form>
  );
}

