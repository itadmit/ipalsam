"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createItemType } from "@/actions/inventory";
import { Package, Hash } from "lucide-react";

interface NewItemFormProps {
  departments: { id: string; name: string }[];
  categoriesByDepartment: Record<string, { id: string; name: string }[]>;
  userDepartmentId: string | null;
  userRole: string;
}

export function NewItemForm({
  departments,
  categoriesByDepartment,
  userDepartmentId,
  userRole,
}: NewItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSelectDepartment = userRole === "super_admin" || userRole === "hq_commander";
  const defaultDeptId = canSelectDepartment ? "" : (userDepartmentId || "");

  const [departmentId, setDepartmentId] = useState(defaultDeptId);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [catalogNumber, setCatalogNumber] = useState("");
  const [type, setType] = useState<"quantity" | "serial">("quantity");
  const [quantityTotal, setQuantityTotal] = useState(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [minimumAlert, setMinimumAlert] = useState(0);
  const [requiresDoubleApproval, setRequiresDoubleApproval] = useState(false);
  const [maxLoanDays, setMaxLoanDays] = useState(0);

  const availableCategories = departmentId ? (categoriesByDepartment[departmentId] || []) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!departmentId) {
      setError("יש לבחור מחלקה");
      return;
    }

    if (!name) {
      setError("יש להזין שם מוצר");
      return;
    }

    setLoading(true);

    try {
      const result = await createItemType({
        name,
        catalogNumber: catalogNumber || undefined,
        departmentId,
        categoryId: categoryId || undefined,
        type,
        quantityTotal: type === "quantity" ? quantityTotal : undefined,
        description: description || undefined,
        notes: notes || undefined,
        minimumAlert,
        requiresDoubleApproval,
        maxLoanDays: maxLoanDays || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard/inventory");
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
        {canSelectDepartment ? (
          <Select
            id="department"
            label="מחלקה"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setCategoryId("");
            }}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="בחר מחלקה"
            required
          />
        ) : (
          <input type="hidden" value={departmentId} />
        )}

        <Select
          id="category"
          label="קטגוריה (אופציונלי)"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={availableCategories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="בחר קטגוריה"
          disabled={!departmentId || availableCategories.length === 0}
        />

        <Input
          id="name"
          label="שם מוצר"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="למשל: מכשיר קשר דגם X"
          required
        />

        <Input
          id="catalogNumber"
          label="מק״ט / מס״ב / צ׳"
          value={catalogNumber}
          onChange={(e) => setCatalogNumber(e.target.value)}
          placeholder="למשל: K-2341"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            סוג ציוד
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("quantity")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                type === "quantity"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Hash
                className={`w-5 h-5 mx-auto mb-2 ${
                  type === "quantity" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  type === "quantity" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                כמותי
              </p>
              <p className="text-xs text-slate-500 mt-1">
                כמות כללית (20 יח')
              </p>
            </button>
            <button
              type="button"
              onClick={() => setType("serial")}
              className={`p-4 rounded-lg border-2 transition-colors ${
                type === "serial"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Package
                className={`w-5 h-5 mx-auto mb-2 ${
                  type === "serial" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  type === "serial" ? "text-emerald-900" : "text-slate-700"
                }`}
              >
                סריאלי
              </p>
              <p className="text-xs text-slate-500 mt-1">
                כל יחידה עם מספר סידורי
              </p>
            </button>
          </div>
        </div>

        {type === "quantity" && (
          <Input
            id="quantityTotal"
            label="כמות התחלתית"
            type="number"
            min={0}
            value={quantityTotal}
            onChange={(e) => setQuantityTotal(parseInt(e.target.value) || 0)}
          />
        )}

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            תיאור (אופציונלי)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
            rows={2}
            className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

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
          צור פריט
        </Button>
      </div>
    </form>
  );
}

